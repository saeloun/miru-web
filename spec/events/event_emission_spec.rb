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
    assert_no_event_reported("Invoices::StatusChanged") do
      Invoice.transaction do
        invoice.update!(status: :paid)
        raise ActiveRecord::Rollback
      end
    end
  end

  it "does not report unchanged invoice status" do
    assert_no_event_reported("Invoices::StatusChanged") { invoice.touch }
  end

  it "reports invitation sent and accepted" do
    invitation = assert_event_reported("Invitations::Sent") { create(:invitation, company:) }[:payload].record

    assert_event_reported("Invitations::Accepted") { invitation.update!(accepted_at: Time.current) }
  end

  it "attributes events to Current.user without leaking record attributes" do
    actor = create(:user)
    Current.user = actor

    payload = assert_event_reported("Clients::Created") { create(:client, company:, name: "Secret Co") }[:payload].to_h

    expect(payload).to eq(actor: { id: actor.id, type: "User" }, data: { client_id: Client.last.id, company_id: company.id })
    expect(payload.to_json).not_to include("Secret Co")
  end
end
