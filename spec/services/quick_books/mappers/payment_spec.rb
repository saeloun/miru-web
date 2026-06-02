# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickBooks::Mappers::Payment do
  describe "#payload" do
    it "links the QuickBooks payment to the exported invoice" do
      company = create(:company)
      connection = create(:quickbooks_connection, company:, settings: {
        "company_name" => "QuickBooks Sandbox Company",
        "service_item_id" => "1",
        "deposit_account_id" => "35"
      })
      invoice = create(:invoice, company:, currency: "USD")
      payment = create(
        :payment,
        invoice:,
        amount: 125.50,
        transaction_date: Date.new(2026, 5, 15),
        transaction_type: :bank_transfer,
        note: "Wire received"
      )
      customer_reference = instance_double(QuickbooksReference, quickbooks_entity_id: "25")
      invoice_reference = instance_double(QuickbooksReference, quickbooks_entity_id: "150")

      payload = described_class.new(connection:).payload(payment, customer_reference:, invoice_reference:)

      expect(payload).to include(
        "CustomerRef" => { "value" => "25" },
        "TotalAmt" => 125.50,
        "TxnDate" => "2026-05-15",
        "CurrencyRef" => { "value" => "USD" },
        "DepositToAccountRef" => { "value" => "35" }
      )
      expect(payload["Line"]).to eq([
        {
          "Amount" => 125.50,
          "LinkedTxn" => [
            {
              "TxnId" => "150",
              "TxnType" => "Invoice"
            }
          ]
        }
      ])
    end
  end
end
