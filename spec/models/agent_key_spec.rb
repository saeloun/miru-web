# frozen_string_literal: true

require "rails_helper"

RSpec.describe AgentKey, type: :model do
  describe ".issue_for" do
    it "returns the plain token and persists only a digest" do
      agent = create(:agent)

      key, plain_token = described_class.issue_for(agent:, name: "Primary Key", created_by: agent.user)

      expect(key.token_digest).to eq(described_class.digest(plain_token))
      expect(plain_token).to be_present
      expect(key.token_digest).not_to eq(plain_token)
    end
  end

  describe ".authenticate" do
    it "returns the active key and updates last_used_at" do
      agent = create(:agent)
      key, plain_token = described_class.issue_for(agent:, name: "Primary Key", created_by: agent.user)

      authenticated_key = travel_to(Time.zone.local(2026, 3, 29, 20, 0, 0)) do
        described_class.authenticate(plain_token)
      end

      expect(authenticated_key).to eq(key)
      expect(key.reload.last_used_at).to eq(Time.zone.local(2026, 3, 29, 20, 0, 0))
    end

    it "does not authenticate revoked keys" do
      agent = create(:agent)
      key, plain_token = described_class.issue_for(agent:, name: "Primary Key", created_by: agent.user)
      key.revoke!

      expect(described_class.authenticate(plain_token)).to be_nil
    end
  end
end
