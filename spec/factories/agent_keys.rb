# frozen_string_literal: true

FactoryBot.define do
  factory :agent_key do
    agent
    created_by { agent.user }
    name { "Primary Key" }
    token_digest { AgentKey.digest(SecureRandom.hex(16)) }
    last_used_at { nil }
    revoked_at { nil }
  end
end
