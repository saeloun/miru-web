# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickBooks::Exporters::Invoice do
  describe "#export!" do
    it "exports the customer dependency and creates a QuickBooks invoice reference" do
      company = create(:company)
      connection = create(:quickbooks_connection, company:, realm_id: "1234567890")
      invoice = create(:invoice, company:)
      create(:invoice_line_item, invoice:, timesheet_entry: nil, quantity: 60, rate: 200)
      customer_reference = create(
        :quickbooks_reference,
        company:,
        quickbooks_connection: connection,
        miru_record: invoice.client,
        quickbooks_entity_type: "Customer",
        quickbooks_entity_id: "25"
      )
      customer_exporter = instance_double(QuickBooks::Exporters::Customer, export!: customer_reference)
      qbo_client = instance_double(QuickBooks::Client)

      allow(QuickBooks::Exporters::Customer).to receive(:new).and_return(customer_exporter)
      allow(qbo_client).to receive(:post).and_return(
        "Invoice" => {
          "Id" => "150",
          "SyncToken" => "0"
        }
      )

      reference = described_class.new(connection:, qbo_client:).export!(invoice.reload)

      expect(QuickBooks::Exporters::Customer).to have_received(:new).with(
        connection:,
        qbo_client:,
        sync_run: kind_of(QuickbooksSyncRun),
        source: :manual
      )
      expect(customer_exporter).to have_received(:export!).with(invoice.client, trigger: :manual)
      expect(qbo_client).to have_received(:post).with(
        "/v3/company/1234567890/invoice",
        hash_including(
          "CustomerRef" => { "value" => "25" },
          "Line" => array_including(hash_including("DetailType" => "SalesItemLineDetail"))
        ),
        {}
      )
      expect(reference).to have_attributes(
        miru_record: invoice,
        quickbooks_entity_type: "Invoice",
        quickbooks_entity_id: "150",
        quickbooks_sync_token: "0",
        status: "synced"
      )
    end
  end
end
