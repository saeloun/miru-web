# frozen_string_literal: true

require "faraday"

module Wise
  class Api
    attr_reader :connection, :profile_id

    def initialize
      @connection = Faraday.new(
        url: ENV["WISE_API_URL"],
        headers: {
          'Authorization': "Bearer #{ENV['WISE_ACCESS_TOKEN']}"
        }
      )
      @profile_id = ENV["WISE_PROFILE_ID"]
    end

    def create_recipient(payload)
      payload["profile"] = profile_id

      connection.post("/v1/accounts", payload.to_json, "Content-Type" => "application/json")
    end

    def fetch_currencies
      connection.get("/v2/borderless-accounts-configuration/profiles/#{profile_id}/available-currencies")
    end

    def fetch_bank_requirements(source_currency, target_currency, source_amount = 1000)
      query = "source=#{source_currency}&target=#{target_currency}&sourceAmount=#{source_amount}"

      connection.get("/v1/account-requirements?#{query}")
    end

    def validate_account_details(pathname, search)
      connection.get("#{pathname}#{search}")
    end

    def fetch_recipient(recipient_id)
      response = connection.get("/v1/accounts/#{recipient_id}")
      deep_compact JSON.parse(response.body)
    end

    def update_recipient(payload)
      delete_recipient(payload["id"])
      create_recipient(payload)
    end

    def delete_recipient(recipient_id)
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
