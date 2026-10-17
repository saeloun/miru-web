# frozen_string_literal: true

module PayrollProviders
  class RazorpayBalance < BalanceAdapter
    def initialize(company_id:, account_id:, key_id:, key_secret:, clock: -> { Time.now.utc })
      super(company_id:, account_id:, currency: "INR", clock:)
      unless key_id.is_a?(String) && key_id.match?(/\Arzp_live_[A-Za-z0-9_]+\z/)
        raise Error, "Live Razorpay balance credentials are required"
      end
      @client = ReadOnlyClient.new(endpoint: :razorpay, company_id: @company_id, key_id:, key_secret:)
    end

    def fetch_balance(company_id:, currency:)
      validate_binding!(company_id, currency)
      result = @client.fetch
      unless result.is_a?(Hash) && result["entity"] == "collection" && result["items"].is_a?(Array) &&
          result["count"].is_a?(Integer) && result["count"] == result["items"].length && result["count"] < 100
        raise Error, "Incomplete Razorpay account response"
      end
      account = select_account!(result["items"], "account_number")
      unless account["entity"] == "banking_balance" && account["currency"] == "INR" &&
          ["current_account", "razorpayx_lite"].include?(account["account_type"])
        raise Error, "Razorpay account is not eligible"
      end
      unless account["refreshed_at"].is_a?(Integer) && account["refreshed_at"].positive?
        raise Error, "Invalid Razorpay observation timestamp"
      end

      balance(provider: "razorpay", environment: "live", amount: account["available_amount"], fetched_at: @clock.call,
        observed_at: Time.at(account["refreshed_at"]).utc)
    rescue RangeError
      raise Error, "Invalid Razorpay observation timestamp", cause: nil
    end
  end
end
