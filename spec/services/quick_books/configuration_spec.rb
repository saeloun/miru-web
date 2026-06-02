# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuickBooks::Configuration do
  around do |example|
    original_env = {
      "APP_BASE_URL" => ENV["APP_BASE_URL"],
      "INTUIT_REDIRECT_URI" => ENV["INTUIT_REDIRECT_URI"],
      "QUICKBOOKS_REDIRECT_URI" => ENV["QUICKBOOKS_REDIRECT_URI"],
      "QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN" => ENV["QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN"]
    }
    example.run
  ensure
    original_env.each do |key, value|
      value.nil? ? ENV.delete(key) : ENV[key] = value
    end
  end

  describe ".webhook_verifier_token" do
    it "reads the verifier token from the environment" do
      ENV["QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN"] = "verifier-token"

      expect(described_class.webhook_verifier_token).to eq("verifier-token")
    end
  end

  describe ".redirect_uri" do
    before do
      ENV.delete("APP_BASE_URL")
      ENV.delete("INTUIT_REDIRECT_URI")
      ENV.delete("QUICKBOOKS_REDIRECT_URI")
    end

    it "uses localhost only in local Rails environments" do
      expect(described_class.redirect_uri).to eq(
        "http://localhost:3000/api/v1/integrations/quickbooks/callback"
      )
    end

    it "does not fall back to localhost outside local Rails environments" do
      allow(Rails.env).to receive(:development?).and_return(false)
      allow(Rails.env).to receive(:test?).and_return(false)

      expect(described_class.redirect_uri).to be_nil
    end
  end

  describe ".configured?" do
    before do
      ENV.delete("APP_BASE_URL")
      ENV.delete("INTUIT_REDIRECT_URI")
      ENV.delete("QUICKBOOKS_REDIRECT_URI")
      allow(Rails.env).to receive(:development?).and_return(false)
      allow(Rails.env).to receive(:test?).and_return(false)
      allow(described_class).to receive(:client_id).and_return("client-id")
      allow(described_class).to receive(:client_secret).and_return("client-secret")
    end

    it "requires an explicit redirect uri outside local Rails environments" do
      expect(described_class.configured?).to be(false)
    end
  end

  describe ".request_timeout_options" do
    it "sets bounded open and read timeouts for QuickBooks requests" do
      expect(described_class.request_timeout_options).to eq(
        open_timeout: 5,
        timeout: 15
      )
    end
  end
end
