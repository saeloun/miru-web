# frozen_string_literal: true

require "digest"
require "json"

module Analytics
  class CacheStore
    DEFAULT_EXPIRY = 30.minutes

    class << self
      def fetch(key, expires_in: DEFAULT_EXPIRY)
        cached_value = read(key)
        return cached_value if cached_value.present?

        value = yield
        write(key, value, expires_in:)
        value
      end

      def write(key, value, expires_in: DEFAULT_EXPIRY)
        normalized_value = normalize(value)

        if redis_client
          redis_client.set(key, JSON.generate(normalized_value), ex: expires_in.to_i)
        else
          Rails.cache.write(key, normalized_value, expires_in:)
        end

        normalized_value
      rescue Redis::BaseError
        Rails.cache.write(key, normalized_value, expires_in:)
        normalized_value
      end

      def read(key)
        if redis_client
          payload = redis_client.get(key)
          payload.present? ? JSON.parse(payload) : nil
        else
          Rails.cache.read(key)
        end
      rescue Redis::BaseError
        Rails.cache.read(key)
      end

      def cache_key(namespace:, company_id:, filters: {})
        digest = Digest::SHA256.hexdigest(filters.to_json)
        ["analytics", namespace, company_id, digest, "v1"].join(":")
      end

      private

        def redis_client
          return @redis_client if defined?(@redis_client)
          return @redis_client = nil if ENV["REDIS_URL"].blank?

          @redis_client = Redis.new(url: ENV["REDIS_URL"])
        end

        def normalize(value)
          value.deep_stringify_keys
        end
    end
  end
end
