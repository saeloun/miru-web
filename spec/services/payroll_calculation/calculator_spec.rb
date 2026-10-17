# frozen_string_literal: true

require "spec_helper"
require_relative "../../../app/services/payroll_calculation/calculator"

RSpec.describe PayrollCalculation::Calculator do
  let(:rounding) do
    { "monthly" => { "mode" => "half_away_from_zero", "digits" => 0 },
      "base" => { "mode" => "half_away_from_zero", "digits" => 0 },
      "fx" => { "mode" => "half_away_from_zero", "digits" => 0 },
      "net" => { "mode" => "half_away_from_zero", "digits" => 0 } }
  end
  let(:policy) do
    { "version" => "synthetic-v1", "effective_from" => "2026-11-01", "effective_to" => "2026-11-30",
      "reviewed" => true, "formula_mapping_confirmed" => true, "attendance_policy_confirmed" => true,
      "deduction_policy_confirmed" => true, "paid_quantity_name" => "reviewed payable days",
      "basis_quantity_name" => "reviewed period days", "rounding" => rounding }
  end
  let(:input) do
    { "company_id" => "synthetic-company", "person_id" => "synthetic-person", "period" => "2026-11",
      "engagement_type" => "employee", "source_currency" => "INR", "settlement_currency" => "INR",
      "compensation" => { "basis" => "monthly", "amount" => "44000", "effective_from" => "2026-01-01", "effective_to" => "2026-12-31" },
      "paid_quantity" => "10", "basis_quantity" => "22", "quantity_source" => "synthetic reviewed facts", "adjustments" => [] }
  end

  def calculate
    described_class.new(policy:, input:).call
  end

  def adjustment(kind, amount, **extra)
    { "code" => kind, "kind" => kind, "amount" => amount, "currency" => "INR", "origin_period" => "2026-11",
      "source" => "synthetic fixture", "reason" => "synthetic example", "reviewed" => true }.merge(extra.transform_keys(&:to_s))
  end

  it "calculates named paid-over-basis quantities without inferring column semantics" do
    result = calculate
    expect(result.values_at("net", "review_ready", "preview_only")).to eq(["20000.0", true, true])
    expect(described_class.verify_snapshot?(result)).to be(true)
  end

  it "keeps engagement classification separate from compensation and currencies" do
    input["engagement_type"] = "consultant"
    expect(calculate.fetch("net")).to eq("20000.0")
  end

  it "rounds annual monthly and prorated stages independently half away from zero" do
    input["compensation"].merge!("basis" => "annual", "amount" => "1000001")
    input["paid_quantity"] = "11"
    expect(calculate.fetch("net")).to eq("41667.0")
    rounding["base"]["digits"] = nil
    rounding["net"]["digits"] = nil
    expect(calculate.fetch("net")).to eq("41666.5")
  end

  it "supports reviewed hourly input without day conversion" do
    input["compensation"].merge!("basis" => "hourly", "amount" => "125.5")
    input.merge!("hours" => "8.5", "hours_source" => "synthetic time records", "hours_reviewed" => true)
    rounding["base"]["digits"] = 2
    rounding["net"]["digits"] = 2
    expect(calculate.fetch("net")).to eq("1066.75")
    input["hours_reviewed"] = false
    expect(calculate.fetch("issues")).to include("hours_require_review")
  end

  it "retains explicit earnings and every confirmed deduction" do
    input["adjustments"] = [adjustment("arrears", "2000"), adjustment("bonus", "1000"),
      adjustment("reimbursement", "1500"), adjustment("gst", "3600"), adjustment("withholding", "2300")]
    expect(calculate.values_at("gross", "deductions", "net")).to eq(["28100.0", "2300.0", "25800.0"])
    input["adjustments"] << adjustment("advance_recovery", "500")
    expect(calculate.fetch("net")).to eq("25300.0")
    policy["deduction_policy_confirmed"] = false
    expect(calculate.fetch("issues")).to include("deduction_policy_confirmed_required")
  end

  it "rejects zero divisors rather than hiding invalid source data as zero" do
    input["basis_quantity"] = "0"
    expect { calculate }.to raise_error(ArgumentError, "basis quantity must be positive")
  end

  it "allows zero payable quantity while retaining adjustments" do
    input["paid_quantity"] = "0"
    input["adjustments"] = [adjustment("bonus", "50")]
    expect(calculate.fetch("net")).to eq("50.0")
  end

  it "preserves fractional above-basis quantities and requires review" do
    input["paid_quantity"] = "24.75"
    expect(calculate.values_at("net", "review_ready")).to eq(["49500.0", false])
    expect(calculate.fetch("issues")).to include("quantity_above_basis")
  end

  it "blocks unconfirmed formula mappings instead of silently repairing inverse formulas" do
    policy["formula_mapping_confirmed"] = false
    expect(calculate.fetch("issues")).to include("formula_mapping_confirmed_required")
    expect(calculate.fetch("review_ready")).to be(false)
  end

  it "requires policy and compensation effective dates to cover the whole period" do
    policy["effective_to"] = "2026-11-29"
    input["compensation"]["effective_from"] = "2026-11-02"
    expect(calculate.fetch("issues")).to include("policy_not_effective_for_period", "compensation_not_effective_for_period")
  end

  context "with explicit FX" do
    before do
      input["compensation"]["amount"] = "47000"
      input["paid_quantity"] = "22"
      input["settlement_currency"] = "USD"
      policy["fx"] = { "from" => "INR", "to" => "USD", "rate" => "94", "direction" => "source_units_per_settlement_unit",
        "as_of" => "2026-11-01", "source" => "synthetic quote", "reviewed" => true }
    end

    it "binds direction, rate and rounding to the result" do
      expect(calculate.fetch("net")).to eq("500.0")
      policy["fx"]["rate"] = "93"
      rounding["fx"]["digits"] = 8
      rounding["net"]["digits"] = 8
      expect(calculate.fetch("net")).to eq("505.37634409")
    end

    it "supports the explicit reciprocal direction" do
      policy["fx"].merge!("rate" => "0.01", "direction" => "settlement_units_per_source_unit")
      expect(calculate.fetch("net")).to eq("470.0")
    end

    it "rejects missing FX or unmatched component currencies" do
      input["adjustments"] << adjustment("bonus", "5", currency: "EUR")
      expect { calculate }.to raise_error(ArgumentError, "FX currency pair mismatch")
      input["adjustments"] = []
      policy.delete("fx")
      expect { calculate }.to raise_error(ArgumentError, /missing payroll field: fx/)
    end

    it "blocks unreviewed or future-dated rates" do
      policy["fx"].merge!("reviewed" => false, "as_of" => "2026-12-01")
      expect(calculate.fetch("issues")).to include("fx_requires_review", "fx_date_after_period")
    end

    it "retains manual net and delta without replacing the calculated amount" do
      input["manual_net"] = { "amount" => "520", "currency" => "USD", "reason" => "synthetic disputed difference", "reviewed" => false }
      expect(calculate.values_at("net", "manual_net_delta")).to eq(["500.0", "20.0"])
      expect(calculate.fetch("issues")).to include("manual_net_requires_review")
    end
  end

  it "blocks already settled adjustments and unreviewed evidence" do
    input["adjustments"] = [adjustment("bonus", "50", settlement_reference: "synthetic-prior-settlement", reviewed: false)]
    expect(calculate.fetch("issues")).to include("already_settled:bonus", "adjustment_requires_review:bonus")
  end

  it "rejects duplicate line identifiers and malformed decimals" do
    input["adjustments"] = [adjustment("bonus", "50"), adjustment("bonus", "60")]
    expect { calculate }.to raise_error(ArgumentError, "duplicate adjustment code")
    input["adjustments"] = []
    input["paid_quantity"] = "NaN"
    expect { calculate }.to raise_error(ArgumentError, /decimal string/)
  end

  it "rejects floating point input and unknown rounding instead of selecting defaults" do
    input["paid_quantity"] = 10.0
    expect { calculate }.to raise_error(ArgumentError, "unsupported value type")
    input["paid_quantity"] = "10"
    rounding["base"]["mode"] = "unknown"
    expect { calculate }.to raise_error(ArgumentError, /rounding is supported/)
  end

  it "makes a detached immutable snapshot and detects tampering" do
    calculator = described_class.new(policy:, input:)
    input["paid_quantity"] = "22"
    result = calculator.call
    expect(result.fetch("net")).to eq("20000.0")
    expect { result.fetch("input")["person_id"].replace("changed") }.to raise_error(FrozenError)
    expect(described_class.verify_snapshot?(result.merge("net" => "999.0"))).to be(false)
    expect(described_class.verify_snapshot?({})).to be(false)
  end

  it "redacts compensation and policy inputs from service inspection" do
    calculator = described_class.new(policy:, input:)

    expect(calculator.inspect).to eq("#<PayrollCalculation::Calculator [REDACTED]>")
    expect(calculator.inspect).not_to include(input.fetch("compensation").fetch("amount"),
      input.fetch("person_id"), policy.fetch("version"))
  end

  it "replays the shared synthetic integration fixture" do
    fixture = JSON.parse(File.read(File.expand_path("../../fixtures/payroll/synthetic_cases.json", __dir__)))
    result = described_class.new(policy: fixture.fetch("policy"), input: fixture.fetch("input")).call
    expect(result.fetch("net")).to eq(fixture.fetch("expected_net"))
    expect(described_class.verify_snapshot?(JSON.parse(JSON.generate(result)))).to be(true)
  end

  it "rejects unsupported top-level objects, missing amounts and invalid periods" do
    expect { described_class.new(policy: [], input:) }.to raise_error(ArgumentError, "policy and input must be objects")
    input["compensation"].delete("amount")
    expect { calculate }.to raise_error(ArgumentError, "missing payroll field: amount")
    input["compensation"]["amount"] = "1"
    input["period"] = "2026-13"
    expect { calculate }.to raise_error(Date::Error)
  end

  it "flags negative net and rounds negative half units away from zero" do
    input["paid_quantity"] = "0"
    input["adjustments"] = [adjustment("withholding", "1.5")]
    expect(calculate.values_at("net", "issues")).to eq(["-2.0", ["negative_net"]])
  end

  it "requires an identified reviewer and reason for manual overrides" do
    input["manual_net"] = { "amount" => "20020", "currency" => "INR", "reason" => "synthetic reviewed exception", "reviewed" => true }
    expect(calculate.fetch("issues")).to include("manual_net_requires_review")
    input["manual_net"]["reviewed_by"] = "synthetic-accounts-reviewer"
    expect(calculate.fetch("issues")).not_to include("manual_net_requires_review")
    input["manual_net"]["reason"] = ""
    expect { calculate }.to raise_error(ArgumentError, "manual net reason is required")
  end

  it "rejects private or unknown fields at every persisted snapshot boundary" do
    input["bank_account"] = "synthetic-unwanted-field"
    expect { calculate }.to raise_error(ArgumentError, "input has unsupported fields")
    input.delete("bank_account")
    policy["provider_key"] = "synthetic-unwanted-field"
    expect { calculate }.to raise_error(ArgumentError, "policy has unsupported fields")
    policy.delete("provider_key")
    input["compensation"]["account"] = "synthetic-unwanted-field"
    expect { calculate }.to raise_error(ArgumentError, "compensation has unsupported fields")
    input["compensation"].delete("account")
    input["adjustments"] = [adjustment("bonus", "5", unknown: "synthetic-unwanted-field")]
    expect { calculate }.to raise_error(ArgumentError, "adjustment has unsupported fields")
    input["adjustments"] = []
    rounding["base"]["unknown"] = true
    expect { calculate }.to raise_error(ArgumentError, "rounding profile has unsupported fields")
  end

  it "rejects malformed nested structures and symbol keys" do
    input["compensation"] = []
    expect { calculate }.to raise_error(ArgumentError, "compensation must be an object")
    input[:unwanted] = true
    expect { calculate }.to raise_error(ArgumentError, "key is required")
  end
end
