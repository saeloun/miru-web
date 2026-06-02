# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickBooks::Exporters::Payment do
  describe "#export!" do
    it "exports the invoice dependency and creates a linked QuickBooks payment reference" do
      company = create(:company)
      connection = create(:quickbooks_connection, company:, realm_id: "1234567890")
      invoice = create(:invoice, company:)
      payment = create(:payment, invoice:, amount: 75)
      create(
        :quickbooks_reference,
        company:,
        quickbooks_connection: connection,
        miru_record: invoice.client,
        quickbooks_entity_type: "Customer",
        quickbooks_entity_id: "25"
      )
      invoice_reference = create(
        :quickbooks_reference,
        company:,
        quickbooks_connection: connection,
        miru_record: invoice,
        quickbooks_entity_type: "Invoice",
        quickbooks_entity_id: "150"
      )
      invoice_exporter = instance_double(QuickBooks::Exporters::Invoice, export!: invoice_reference)
      qbo_client = instance_double(QuickBooks::Client)

      allow(QuickBooks::Exporters::Invoice).to receive(:new).and_return(invoice_exporter)
      allow(qbo_client).to receive(:post).and_return(
        "Payment" => {
          "Id" => "275",
          "SyncToken" => "0"
        }
      )

      reference = described_class.new(connection:, qbo_client:).export!(payment)

      expect(QuickBooks::Exporters::Invoice).to have_received(:new).with(
        connection:,
        qbo_client:,
        sync_run: kind_of(QuickbooksSyncRun),
        source: :manual
      )
      expect(invoice_exporter).to have_received(:export!).with(invoice, trigger: :manual)
      expect(qbo_client).to have_received(:post).with(
        "/v3/company/1234567890/payment",
        hash_including(
          "CustomerRef" => { "value" => "25" },
          "Line" => [
            {
              "Amount" => 75.0,
              "LinkedTxn" => [
                {
                  "TxnId" => "150",
                  "TxnType" => "Invoice"
                }
              ]
            }
          ]
        ),
        {}
      )
      expect(reference).to have_attributes(
        miru_record: payment,
        quickbooks_entity_type: "Payment",
        quickbooks_entity_id: "275",
        quickbooks_sync_token: "0",
        status: "synced"
      )
    end
  end
end
