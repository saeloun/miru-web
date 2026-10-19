# frozen_string_literal: true

require "spec_helper"
require_relative "../../../app/services/payroll/entitlement"

RSpec.describe Payroll::Entitlement do
  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return(nil)
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return(nil)
  end

  it "defaults off for every company and requires an explicit trusted enable" do
    expect(described_class.enabled?(11)).to be(false)
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return("11")
    expect(described_class.enabled?(11)).to be(false)
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("true")
    expect(described_class.enabled?(11)).to be(true)
    expect(described_class.enabled?(12)).to be(false)
  end

  [nil, "", "0", "-11", "011", "11.0", "11,12", "all", " 11", "11 ", "9223372036854775808"].each do |value|
    it "rejects a missing or malformed configured ID #{value.inspect}" do
      allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("true")
      allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return(value)
      expect(described_class.enabled?(11)).to be(false)
    end
  end

  [true, "TRUE", "1", "yes", "false", " true "].each do |value|
    it "rejects an ambiguous enable value #{value.inspect}" do
      allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return(value)
      allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return("11")
      expect(described_class.enabled?(11)).to be(false)
    end
  end

  it "never authorizes a tenant name, domain, email or string client ID" do
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("true")
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return("11")
    ["11", "Saeloun", "saeloun.com", "owner@saeloun.com", nil, 0, -11].each do |identity|
      expect(described_class.enabled?(identity)).to be(false)
      expect { described_class.require!(identity) }.to raise_error(described_class::NotEnabled)
    end
  end
end
