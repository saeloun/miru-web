# frozen_string_literal: true

module Payroll
  module Entitlement
    class NotEnabled < StandardError; end

    def self.enabled?(company_id)
      configured_id = ENV["MIRU_PAYROLL_SAELOUN_COMPANY_ID"]
      ENV["MIRU_PAYROLL_ENABLED"] == "true" && company_id.is_a?(Integer) && company_id.positive? &&
        configured_id.is_a?(String) && configured_id.match?(/\A[1-9]\d{0,18}\z/) &&
        configured_id.to_i <= 9_223_372_036_854_775_807 && company_id.to_s == configured_id
    end

    def self.require!(company_id)
      raise NotEnabled, "Payroll is not enabled for this company" unless enabled?(company_id)
    end
  end
end
