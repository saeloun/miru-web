# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Event emission" do
  let(:company) { create(:company) }
  let(:client) { create(:client, company:) }
  let(:invoice) { create(:invoice, company:, client:) }

  after { Current.reset }

  it "reports self registration with the user as actor" do
    event = assert_event_reported("Users::Registered") { create(:user) }

    expect(event[:payload].actor).to eq(event[:payload].record)
  end

  it "reports registration by another user with that user as actor" do
    Current.user = create(:user)

    event = assert_event_reported("Users::Registered") { create(:user) }

    expect(event[:payload].actor).to eq(Current.user)
  end

  it "reports created records" do
    project = assert_event_reported("Projects::Created") { create(:project, client:) }[:payload].record

    assert_event_reported("Companies::Created") { create(:company) }
    assert_event_reported("Clients::Created") { create(:client, company:) }
    assert_event_reported("TimesheetEntries::Created") { create(:timesheet_entry, project:) }
    assert_event_reported("Payments::Recorded") { create(:payment, invoice:) }
    assert_event_reported("Expenses::Created") { create(:expense, company:) }

    created = assert_event_reported("Invoices::Created") { create(:invoice, company:, client:, status: :sent) }
    expect(created[:payload].to_h[:data]).to include(status: "sent")
  end

  it "reports invoice status changes with from and to" do
    invoice.update!(status: :draft)

    event = assert_event_reported("Invoices::StatusChanged") { invoice.update!(status: :sent) }

    expect(event[:payload].to_h[:data]).to include(invoice_id: invoice.id, from: "draft", to: "sent")
  end

  it "reports a status change followed by another save in the same transaction" do
    invoice.update!(status: :sent)

    event = assert_event_reported("Invoices::StatusChanged") do
      Invoice.transaction do
        invoice.update!(status: :paid)
        invoice.update!(reference: "after-settle")
      end
    end

    expect(event[:payload].to_h[:data]).to include(from: "sent", to: "paid")
  end

  it "does not report a status change that rolls back" do
    invoice
    expect do
      Invoice.transaction(requires_new: true) do
        invoice.update!(status: :paid)
        raise ActiveRecord::Rollback
      end
    end.not_to change { RailsEventViewer::Entry.where(name: "Invoices::StatusChanged").count }
  end

  it "keeps the outer status event when a savepoint rolls back" do
    invoice.update!(status: :draft)
    events = RailsEventViewer::Entry.where(name: "Invoices::StatusChanged")

    expect do
      Invoice.transaction(requires_new: true) do
        invoice.update!(status: :sent)
        Invoice.transaction(requires_new: true) do
          invoice.update!(status: :viewed)
          raise ActiveRecord::Rollback
        end
      end
    end.to change { events.count }.by(1)

    expect(invoice.reload.status).to eq("sent")
    expect(events.last.payload["data"]).to include("from" => "draft", "to" => "sent")
  end

  it "writes creation events within the record transaction" do
    company
    events = RailsEventViewer::Entry.where(name: "Clients::Created")

    expect do
      Client.transaction(requires_new: true) do
        client = create(:client, company:)
        expect(events.last.payload["data"]).to include("client_id" => client.id)
        raise ActiveRecord::Rollback
      end
    end.not_to change { events.count }
  end

  it "preserves the business write and reports the failure when event storage fails" do
    company
    allow(RailsEventViewer::Entry).to receive(:insert_all) do
      RailsEventViewer::Entry.connection.execute("SELECT 1 / 0")
    end
    allow(Rails.error).to receive(:report).and_call_original
    Rails.event.raise_on_error = false

    client = create(:client, company:)

    expect(Client.exists?(client.id)).to be(true)
    expect(Client.connection.select_value("SELECT 1")).to eq(1)
    expect(Rails.error).to have_received(:report).with(an_instance_of(ActiveRecord::StatementInvalid), handled: true)
  ensure
    Rails.event.raise_on_error = Rails.application.config.consider_all_requests_local
  end

  it "does not report unchanged invoice status" do
    assert_no_event_reported("Invoices::StatusChanged") { invoice.touch }
  end

  it "reports invitation sent and accepted" do
    invitation = assert_event_reported("Invitations::Sent") { create(:invitation, company:) }[:payload].record

    assert_event_reported("Invitations::Accepted") { invitation.update!(accepted_at: Time.current) }
  end

  it "keeps invitation acceptance after an unrelated save" do
    invitation = create(:invitation, company:)
    events = RailsEventViewer::Entry.where(name: "Invitations::Accepted")

    expect do
      Invitation.transaction do
        invitation.update!(accepted_at: Time.current)
        invitation.update!(expired_at: 1.day.from_now)
      end
    end.to change { events.count }.by(1)
  end

  it "attributes events to Current.user without leaking record attributes" do
    actor = create(:user)
    Current.user = actor

    payload = assert_event_reported("Clients::Created") { create(:client, company:, name: "Secret Co") }[:payload].to_h

    expect(payload).to eq(actor: { id: actor.id, type: "User" }, data: { client_id: Client.last.id, company_id: company.id })
    expect(payload.to_json).not_to include("Secret Co")
  end
end
