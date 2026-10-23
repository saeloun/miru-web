# frozen_string_literal: true

module PayrollEntitlementHelper
  def enable_synthetic_payroll(company_id)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("true")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return(company_id.to_s)
  end
end

RSpec.configure { |config| config.include PayrollEntitlementHelper }
