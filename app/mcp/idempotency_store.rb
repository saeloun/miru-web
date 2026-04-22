# frozen_string_literal: true

require "digest"

module MCP
  module Miru
    class IdempotencyStore
      CACHE_TTL = 24.hours

      class << self
        def fetch(tool_name:, idempotency_key:, authorization:, &block)
          return yield if idempotency_key.blank?

          cache_key = build_key(tool_name:, idempotency_key:, authorization:)
          cached = Rails.cache.read(cache_key)
          return MCP::Miru::ApiProxy::Result.from_h(cached) if cached.present?

          result = yield
          Rails.cache.write(cache_key, result.to_h, expires_in: CACHE_TTL)
          result
        end

        private

          def build_key(tool_name:, idempotency_key:, authorization:)
            auth_digest = Digest::SHA256.hexdigest(authorization.to_s)
            "mcp:idempotency:#{tool_name}:#{auth_digest}:#{idempotency_key}"
          end
      end
    end
  end
end
