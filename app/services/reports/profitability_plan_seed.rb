# frozen_string_literal: true

module Reports
  class ProfitabilityPlanSeed
    def self.process(user:, company:, currency: "INR")
      report = CompensationProfitability.new(user:, company:, filters: { currency:, period: "month" }).process
      {
        "currency" => report[:currency], "start_month" => Date.current.beginning_of_month.iso8601,
        "months" => "12", "reserve_months" => "3", "opening_cash" => "", "monthly_collections" => "",
        "people" => report[:people].map do |person|
          fx = ExchangeRate.rate_for(person[:compensation_currency], report[:currency], Date.current) if person[:compensation_currency]
          monthly = person[:annual_compensation] && fx && person[:annual_compensation] * fx.to_d / 12
          { "name" => person[:person], "capacity_hours" => person[:available_hours]&.to_s("F"),
            "billing_rate" => person[:effective_rate]&.round(4)&.to_s("F"), "utilization" => "80",
            "monthly_compensation" => monthly&.round(4)&.to_s("F") }
        end,
        "overheads" => [],
        "source" => { "captured_at" => report[:generated_at], "from" => report[:from], "to" => report[:to],
          "conversion_date" => Date.current.iso8601, "exchange_rates" => JSON.parse(report[:exchange_rates].to_json),
          "people" => report[:people].map { |person| { "name" => person[:person], "flags" => person[:flags] } } }
      }
    end
  end
end
