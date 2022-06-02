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

    def fetch_bank_requirements(source_currency, target_currency, source_amount = 1000)
      query = "source=#{source_currency}&target=#{target_currency}&sourceAmount=#{source_amount}"

      connection.get("/v1/account-requirements?#{query}")
    end

    def validate_account_details(pathname, search)
      connection.get("#{pathname}#{search}")
    end
  end
end
