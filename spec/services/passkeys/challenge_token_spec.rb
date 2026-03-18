# frozen_string_literal: true

require "rails_helper"

RSpec.describe Passkeys::ChallengeToken do
  describe ".issue" do
    it "embeds the payload and an expiry timestamp" do
      token = described_class.issue("challenge" => "abc123")
      payload = described_class.verify(token)

      expect(payload["challenge"]).to eq("abc123")
      expect(payload["expires_at"]).to be_present
    end
  end

  describe ".verify" do
    it "raises for an expired token" do
      expired_token = described_class.verifier.generate({
        "challenge" => "stale",
        "expires_at" => 1.minute.ago.to_i
      })

      expect {
        described_class.verify(expired_token)
      }.to raise_error(Passkeys::ChallengeToken::InvalidTokenError)
    end

    it "raises for an invalid token" do
      expect {
        described_class.verify("bad-token")
      }.to raise_error(Passkeys::ChallengeToken::InvalidTokenError)
    end
  end
end
