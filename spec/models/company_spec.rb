# frozen_string_literal: true

require "rails_helper"

RSpec.describe Company, type: :model do
  let(:company) { build(:company) }

  it "is valid with valid attributes" do
    expect(company).to be_valid
  end

  context "checking the presence of each attribute" do
    it "is not valid without a name" do
      company.name = nil
      expect(company).to_not be_valid
    end

    it "is not valid without an address" do
      company.address = nil
      expect(company).to_not be_valid
    end

    it "is not valid without a standard_price" do
      company.standard_price = nil
      expect(company).to_not be_valid
    end

    it "is not valid without an country" do
      company.country = nil
      expect(company).to_not be_valid
    end
  end

  describe "validations" do
    it { should validate_presence_of(:business_phone) }
    it { should validate_presence_of(:base_currency) }
  end
end
