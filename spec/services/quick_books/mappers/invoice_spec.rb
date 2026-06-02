# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickBooks::Mappers::Invoice do
  describe "#payload" do
    let(:company) { create(:company) }
    let(:client) { create(:client, company:, email: "billing@example.com") }
    let(:connection) { create(:quickbooks_connection, company:) }
    let(:customer_reference) { instance_double(QuickbooksReference, quickbooks_entity_id: "25") }

    it "maps Miru invoice lines to QuickBooks sales item lines" do
      invoice = create(
        :invoice,
        company:,
        client:,
        invoice_number: "INV-100",
        issue_date: Date.new(2026, 5, 1),
        due_date: Date.new(2026, 5, 31)
      )
      create(
        :invoice_line_item,
        invoice:,
        timesheet_entry: nil,
        name: "Engineering",
        description: "Retainer",
        quantity: 120,
        rate: 150,
        date: Date.new(2026, 5, 1)
      )

      payload = described_class.new(connection:).payload(invoice.reload, customer_reference:)

      expect(payload).to include(
        "CustomerRef" => { "value" => "25" },
        "DocNumber" => "INV-100",
        "TxnDate" => "2026-05-01",
        "DueDate" => "2026-05-31",
        "BillEmail" => { "Address" => "billing@example.com" }
      )
      expect(payload["Line"].first).to include(
        "DetailType" => "SalesItemLineDetail",
        "Amount" => 300.0,
        "Description" => "Engineering - Retainer"
      )
      expect(payload["Line"].first["SalesItemLineDetail"]).to include(
        "ItemRef" => { "value" => "1" },
        "Qty" => 2.0,
        "UnitPrice" => 150.0,
        "ServiceDate" => "2026-05-01"
      )
    end

    it "requires a service item mapping" do
      connection.update!(settings: connection.settings.merge("service_item_id" => nil))
      invoice = create(:invoice, company:, client:)

      expect {
        described_class.new(connection:).payload(invoice, customer_reference:)
      }.to raise_error(
        QuickBooks::MappingError,
        "QuickBooks service item mapping is required before exporting invoices"
      )
    end
  end
end
