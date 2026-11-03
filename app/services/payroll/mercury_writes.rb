# frozen_string_literal: true

module Payroll
  module MercuryWrites
    SWITCH = "MIRU_PAYROLL_MERCURY_WRITE_ENVIRONMENT"

    def self.enabled?(company_id, environment)
      Entitlement.enabled?(company_id) && PayrollMercuryConnection::ENVIRONMENTS.include?(environment) &&
        ENV[SWITCH] == environment
    end
  end
end
