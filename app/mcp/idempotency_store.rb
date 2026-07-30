# frozen_string_literal: true

require "digest"

module MCP
  module Miru
    class IdempotencyStore
      CACHE_TTL = 24.hours

      class << self
        def fetch(tool_name:, idempotency_key:, authorization:, &block)
          return yield if idempotency_key.blank?

          key_digest = Digest::SHA256.hexdigest(build_key(tool_name:, idempotency_key:, authorization:))
          with_advisory_lock(key_digest) do
            MCPIdempotencyRecord.expired.delete_all
            cached = MCPIdempotencyRecord.find_by(key_digest:)
            return MCP::Miru::ApiProxy::Result.from_h(cached.response) if cached

            result = yield
            cache_result(key_digest, result) if result.success?
            result
          end
        end

        private

          def cache_result(key_digest, result)
            MCPIdempotencyRecord.create!(
              key_digest:,
              response: result.to_h,
              expires_at: CACHE_TTL.from_now
            )
          end

          def with_advisory_lock(key_digest)
            lock_id = [key_digest].pack("H*").unpack1("q>")

            ApplicationRecord.connection_pool.with_connection do |connection|
              acquired = connection.select_value("SELECT pg_try_advisory_lock(#{lock_id})")
              raise "Request with this idempotency key is already in progress" unless acquired

              begin
                yield
              ensure
                connection.execute("SELECT pg_advisory_unlock(#{lock_id})")
              end
            end
          end

          def build_key(tool_name:, idempotency_key:, authorization:)
            auth_digest = Digest::SHA256.hexdigest(authorization.to_s)
            "mcp:idempotency:#{tool_name}:#{auth_digest}:#{idempotency_key}"
          end
      end
    end
  end
end
