# frozen_string_literal: true

require "rails_helper"

RSpec.describe FormatAmountService do
  describe "#process" do
    it "returns formatted amount when valid amount is passed" do
      expect(described_class.new("USD", 1000).process).to eq "$1,000.00"
    end

    it "returns formatted amount when base currency is invalid" do
      expect(described_class.new("", 1000).process).to eq "1000.0"
    end

    it "returns amount when currency is nil" do
      expect(described_class.new(nil, 1000).process).to eq "$1,000.00"
    end

    it "returns amount when amount is nil" do
      expect(described_class.new("USD", nil).process).to eq "0.0"
    end

    it "returns amount when amount is empty string" do
      expect(described_class.new("USD", "").process).to eq "0.0"
    end

    it "returns amount when amount is random string" do
      expect(described_class.new("USD", "string").process).to eq "0.0"
    end
  end
end
