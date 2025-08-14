# frozen_string_literal: true

module Wise
  class Recipient < Api
    def create(payload)
      payload["profile"] = profile_id

      connection.post(
        "/v1/accounts",
        payload.to_json,
        "Content-Type" => "application/json"
      )
    end

    def fetch(recipient_id)
      response = connection.get("/v1/accounts/#{recipient_id}")
      deep_compact JSON.parse(response.body)
    end

    def update(payload)
      delete(payload["id"])
      create(payload)
    end

    def delete(recipient_id)
      connection.delete("/v1/accounts/#{recipient_id}")
    end

    private

      def deep_compact(hash)
        hash.compact.transform_values do |value|
          next value unless value.class == Hash

          deep_compact(value)
        end.reject { |key, value| value.to_s.empty? || ["user", "active", "ownedByCustomer", "business"].include?(key) }
      end
  end
end
