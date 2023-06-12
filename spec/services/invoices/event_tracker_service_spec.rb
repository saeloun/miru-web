# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invoices::EventTrackerService, type: :service do
  let(:invoice) { create(:invoice) }
  let(:create_invoice_event_type) { "create" }
  let(:send_invoice_event_type) { "send_invoice" }
  let(:extra_data) { { invoice_email: { recipients: ["test@example.com"] } } }
  let(:ahoy_instance) { instance_double(Ahoy::Tracker) }

  before do
    allow(Ahoy).to receive(:instance).and_return(ahoy_instance)
    allow(ahoy_instance).to receive(:track)
  end

  describe "#process" do
    it "tracks the event" do
      allow(ahoy_instance).to receive(:track).with("create_invoice", { type: :invoice, id: invoice.id })

      described_class.new(create_invoice_event_type, invoice).process
    end

    it "tracks the event with extra data" do
      allow(ahoy_instance).to receive(:track).with(
        "send_invoice",
        { type: :invoice, id: invoice.id, emails: extra_data[:invoice_email][:recipients] })

      described_class.new(send_invoice_event_type, invoice, extra_data).process
    end
  end
end
