# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::ProfitabilityProjection do
  let(:assumptions) do
    { currency: "USD", start_month: "2026-12-01", months: 3, reserve_months: 3,
      opening_cash: "10000", monthly_collections: "4000",
      people: [{ name: "Planned consultant", project: "Client work", capacity_hours: "160", utilization: "80",
        billing_rate: "50", monthly_compensation: "3000" }],
      overheads: [{ name: "Software", monthly_amount: "500" }] }
  end

  def projection(**changes)
    described_class.new(assumptions.merge(changes)).process
  end

  it "calculates monthly profitability, aggregate utilization and cash separately from billings" do
    result = projection
    expect(result[:summary]).to include(revenue: 6400.to_d, compensation: 3000.to_d, overhead: 500.to_d,
      cost: 3500.to_d, margin: 2900.to_d, utilization: 80.to_d, net_cash_burn: -500.to_d,
      runway_months: nil, months_to_reserve: 1.to_d)
    expect(result[:summary][:margin_percentage]).to be_within(0.001).of(45.3125)
    expect(result[:months].pluck(:month)).to eq(%w[2026-12-01 2027-01-01 2027-02-01])
    expect(result[:months].last[:closing_cash]).to eq(11_500.to_d)
    expect(result[:totals]).to include(revenue: 19_200.to_d, cost: 10_500.to_d, margin: 8700.to_d)
  end

  it "withholds incomplete costs and dependent totals instead of treating a blank as zero" do
    assumptions[:people].first[:monthly_compensation] = ""
    result = projection
    expect(result[:people].first[:flags]).to include("Missing monthly compensation")
    expect(result[:summary]).to include(revenue: 6400.to_d, cost: nil, margin: nil, runway_months: nil)
    expect(result[:months].last[:closing_cash]).to be_nil
  end

  it "supports explicit zero revenue and costs, without dividing by zero" do
    assumptions[:people].first.merge!(utilization: "0", billing_rate: "", monthly_compensation: "0")
    result = projection(overheads: [], monthly_collections: "0", opening_cash: "0")
    expect(result[:summary]).to include(revenue: 0.to_d, cost: 0.to_d, margin: 0.to_d, margin_percentage: nil,
      runway_months: nil, months_to_reserve: 0.to_d)
  end

  it "requires explicit cash assumptions, even when projected billings exist" do
    expect(projection(opening_cash: "", monthly_collections: "")[:summary]).to include(net_cash_burn: nil,
      runway_months: nil, months_to_reserve: nil)
    expect(projection(opening_cash: "0", monthly_collections: "1000")[:summary]).to include(
      runway_months: 0.to_d, months_to_reserve: nil)
  end

  it "uses aggregate hours rather than averaging person utilization and handles negative cash" do
    assumptions[:people] << { name: "Part time", capacity_hours: "40", utilization: "0", billing_rate: "20", monthly_compensation: "1000" }
    result = projection(monthly_collections: "1000", opening_cash: "1000")
    expect(result[:summary]).to include(utilization: 64.to_d, net_cash_burn: 3500.to_d)
    expect(result[:summary][:runway_months]).to be_within(0.0001).of(1000.to_d / 3500)
    expect(result[:months].first[:closing_cash]).to eq(-2500.to_d)
  end

  it "rejects malformed, infinite, negative and out-of-range assumptions" do
    ["oops", "NaN", "Infinity", "-1", "101", "1e5"].each do |value|
      assumptions[:people].first[:utilization] = value
      expect { projection }.to raise_error(described_class::InvalidAssumptions)
    end
    expect { projection(months: "25") }.to raise_error(described_class::InvalidAssumptions)
    expect { projection(start_month: "2026-02-30") }.to raise_error(described_class::InvalidAssumptions)
    expect { projection(currency: "EUR") }.to raise_error(described_class::InvalidAssumptions)
    expect { projection(people: {}) }.to raise_error(described_class::InvalidAssumptions)
  end
end
