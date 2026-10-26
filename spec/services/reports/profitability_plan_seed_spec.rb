# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::ProfitabilityPlanSeed do
  it "uses full monthly compensation rather than repeating a joiner's prorated first month" do
    travel_to Time.zone.local(2026, 7, 20) do
      company = create(:company, plan_tier: "paid", compensation_proration: "calendar_days")
      user = create(:user, current_workspace: company)
      user.add_role(:owner, company)
      employment = create(:employment, user:, company:, joined_at: "2026-07-16", resigned_at: nil)
      EmployeeRecord.create!(employment:, private_details: { "salary_amount" => "3100", "salary_currency" => "INR",
        "salary_frequency" => "monthly", "salary_effective_on" => "2026-07-16" })
      ExchangeRate.set_rate("USD", "INR", 80, Date.new(2026, 7, 1), "synthetic")
      seed = described_class.process(user:, company:, currency: "INR")
      expect(seed.fetch("people").first.fetch("monthly_compensation").to_d).to eq(3100.to_d)
      usd = described_class.process(user:, company:, currency: "USD")
      expect(usd.fetch("people").first.fetch("monthly_compensation").to_d).to eq(38.75.to_d)
    end
  end
end
