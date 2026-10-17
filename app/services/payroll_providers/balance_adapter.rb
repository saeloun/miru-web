# frozen_string_literal: true

require "digest"
require "time"

module PayrollProviders
  class BalanceAdapter
    MAX_AGE_SECONDS = 300

    def initialize(company_id:, account_id:, currency:, clock: -> { Time.now.utc })
      unless company_id.is_a?(Integer) && company_id.positive? && account_id.is_a?(String) && !account_id.empty?
        raise Error, "Company and account binding are required"
      end

      @company_id, @account_id, @currency, @clock = company_id, account_id.dup.freeze, currency, clock
    end

    def inspect
      "#<#{self.class.name} [REDACTED]>"
    end

    private

      def validate_binding!(company_id, currency)
        unless company_id == @company_id && currency == @currency
          raise Error, "Balance company or currency mismatch"
        end
      end

      def select_account!(accounts, key)
        unless accounts.is_a?(Array) && accounts.all? { |account| account.is_a?(Hash) && account[key].is_a?(String) }
          raise Error, "Malformed provider accounts"
        end
        matches = accounts.select { |account| account[key] == @account_id }
        raise Error, "Configured provider account is missing or ambiguous" unless matches.length == 1

        matches.first
      end

      def balance(provider:, environment:, amount:, fetched_at:, observed_at: nil)
        unless amount.is_a?(Integer) && amount >= 0
          raise Error, "Invalid available balance"
        end
        if observed_at && (observed_at < fetched_at - MAX_AGE_SECONDS || observed_at > fetched_at + 30)
          raise Error, "Provider balance observation is stale or invalid"
        end

        {
          provider:, environment:, company_id: @company_id, currency: @currency, available_minor_units: amount,
          account_reference: Digest::SHA256.hexdigest("#{provider}:#{@company_id}:#{@account_id}").freeze,
          fetched_at: fetched_at.dup.freeze, observed_at: observed_at&.dup&.freeze
        }.freeze
      end
  end
end
