# frozen_string_literal: true

module PayrollProviders
  class MercuryBalance < BalanceAdapter
    def initialize(binding:, token:, environment:, clock: -> { Time.now.utc })
      super(company_id: binding[:company_id], account_id: binding[:account_id], currency: "USD", clock:)
      legal_business_name = binding[:legal_business_name]
      unless legal_business_name.is_a?(String) && !legal_business_name.empty?
        raise Error, "Expected legal business name is required"
      end
      endpoint = { live: :mercury_live, sandbox: :mercury_sandbox }[environment]
      raise Error, "Unsupported Mercury environment" unless endpoint

      @environment = environment.to_s.freeze
      @legal_business_name = legal_business_name.dup.freeze
      @client = ReadOnlyClient.new(endpoint:, token:)
    end

    def fetch_balance(company_id:, currency:)
      validate_binding!(company_id, currency)
      result = @client.fetch
      unless result.is_a?(Hash) && result["page"].is_a?(Hash) &&
          result["page"].keys.sort == ["nextPage", "previousPage"] && result["page"].values.all?(&:nil?)
        raise Error, "Incomplete Mercury account response"
      end
      account = select_account!(result["accounts"], "id")
      unless account["status"] == "active" && account["type"] == "mercury" &&
          account["legalBusinessName"] == @legal_business_name
        raise Error, "Mercury account is not eligible for this company"
      end
      amount = account["availableBalance"]
      unless amount.is_a?(Integer) || amount.is_a?(BigDecimal)
        raise Error, "Invalid Mercury available balance"
      end
      minor_units = amount * 100
      unless minor_units.finite? && minor_units == minor_units.to_i
        raise Error, "Invalid Mercury balance precision"
      end

      balance(provider: "mercury", environment: @environment, amount: minor_units.to_i, fetched_at: @clock.call)
    end
  end
end
