# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoiceTax, type: :model do
  describe "validations" do
    it "does not allow a tax configuration from another company" do
      invoice = create(:invoice)
      tax_configuration = create(:tax_configuration)

      invoice_tax = build(:invoice_tax, invoice:, tax_configuration:)

      expect(invoice_tax).not_to be_valid
      expect(invoice_tax.errors[:tax_configuration]).to include("must belong to the same company")
    end
  end

  describe "#sync_amount_from_subtotal" do
    it "stores a calculated tax amount" do
      invoice_tax = build(:invoice_tax, calculation_method: "percentage", value: 18)

      invoice_tax.sync_amount_from_subtotal(250)

      expect(invoice_tax.amount).to eq(45)
    end
  end
end
