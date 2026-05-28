# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickBooks::Configuration do
  describe ".webhook_verifier_token" do
    around do |example|
      original_value = ENV["QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN"]
      example.run
      original_value.nil? ? ENV.delete("QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN") : ENV["QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN"] = original_value
    end

    it "reads the verifier token from the environment" do
      ENV["QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN"] = "verifier-token"

      expect(described_class.webhook_verifier_token).to eq("verifier-token")
    end
  end
end
