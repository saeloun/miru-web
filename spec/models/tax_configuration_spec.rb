# frozen_string_literal: true

require "rails_helper"

RSpec.describe TaxConfiguration, type: :model do
  describe "#calculate_amount" do
    it "calculates percentage taxes from subtotal" do
      tax_configuration = build(:tax_configuration, calculation_method: "percentage", value: 9)

      expect(tax_configuration.calculate_amount(1000)).to eq(90)
    end

    it "returns flat taxes as configured" do
      tax_configuration = build(:tax_configuration, calculation_method: "flat", value: 50)

      expect(tax_configuration.calculate_amount(1000)).to eq(50)
    end
  end
end
