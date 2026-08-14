# frozen_string_literal: true

require "rails_helper"

RSpec.describe MCP::Miru::IdempotencyStore do
  describe ".fetch" do
    let(:tool_name) { "miru.time.create" }
    let(:authorization) { "Bearer token-1" }
    let(:result) do
      MCP::Miru::ApiProxy::Result.new(
        status: 200,
        headers: { "content-type" => "application/json" },
        body: '{"ok":true}',
        json: { "ok" => true }
      )
    end

    it "does not cache results when idempotency key is blank" do
      calls = 0

      2.times do
        described_class.fetch(tool_name:, idempotency_key: nil, authorization:) do
          calls += 1
          result
        end
      end

      expect(calls).to eq(2)
    end

    it "returns cached result for repeated key and authorization" do
      calls = 0

      first = described_class.fetch(tool_name:, idempotency_key: "abc-123", authorization:) do
        calls += 1
        result
      end

      second = described_class.fetch(tool_name:, idempotency_key: "abc-123", authorization:) do
        calls += 1
        result
      end

      expect(calls).to eq(1)
      expect(second.to_h).to eq(first.to_h)
    end

    it "isolates cache entries by authorization digest" do
      calls = 0

      described_class.fetch(tool_name:, idempotency_key: "abc-123", authorization: "Bearer token-1") do
        calls += 1
        result
      end

      described_class.fetch(tool_name:, idempotency_key: "abc-123", authorization: "Bearer token-2") do
        calls += 1
        result
      end

      expect(calls).to eq(2)
    end

    it "does not cache unsuccessful results" do
      calls = 0
      failed_result = MCP::Miru::ApiProxy::Result.new(
        status: 500,
        headers: {},
        body: '{"error":"temporary"}',
        json: { "error" => "temporary" }
      )

      2.times do
        described_class.fetch(tool_name:, idempotency_key: "retryable", authorization:) do
          calls += 1
          failed_result
        end
      end

      expect(calls).to eq(2)
    end

    it "does not run a duplicate request while the first request is in progress" do
      duplicate_error = nil

      described_class.fetch(tool_name:, idempotency_key: "in-progress", authorization:) do
        Thread.new do
          described_class.fetch(tool_name:, idempotency_key: "in-progress", authorization:) { result }
        rescue StandardError => error
          duplicate_error = error
        end.join

        result
      end

      expect(duplicate_error).to be_present
      expect(duplicate_error.message).to match(/already in progress/)
    end

    it "retries expired results" do
      key = described_class.send(
        :build_key,
        tool_name:,
        idempotency_key: "expired",
        authorization:
      )
      MCPIdempotencyRecord.create!(
        key_digest: Digest::SHA256.hexdigest(key),
        response: result.to_h,
        expires_at: 1.second.ago
      )

      calls = 0
      described_class.fetch(tool_name:, idempotency_key: "expired", authorization:) do
        calls += 1
        result
      end

      expect(calls).to eq(1)
    end
  end
end
