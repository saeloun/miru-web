# frozen_string_literal: true

require "rails_helper"

RSpec.describe "India annual salary tax estimates" do
  def estimate(**changes)
    IndiaTax::SalaryEstimate.new({
      "tax_year" => "2026-27", "currency" => "INR", "age_group" => "under_60",
      "gross_salary" => "1275000", "taxable_interest" => "0", "deductions" => {}, "employer_pensions" => [],
      "scope_confirmed" => true, "eligibility_confirmed" => true
    }.merge(changes.stringify_keys)).call
  end

  def regime(result, name)
    result.fetch("regimes").fetch(name)
  end

  it "applies the official 12.75 lakh salary example without treating standard deduction as cash withholding" do
    result = estimate
    expect(regime(result, "new")).to include("taxable_income" => "1200000.0", "annual_tax" => "0.0", "rebate" => "60000.0")
    expect(regime(result, "old")["annual_tax"]).to eq("187200.0")
    expect(result).to include("estimate_only" => true, "payroll_ready" => false, "preferred_regime" => "new")
  end

  { "1300000" => %w[195000.0 26000.0], "1875000" => %w[374400.0 166400.0],
    "2575000" => %w[592800.0 343200.0] }.each do |salary, expected|
    it "matches the independently derived regime totals for salary #{salary}" do
      result = estimate(gross_salary: salary)
      expect(%w[old new].map { |name| regime(result, name).fetch("annual_tax") }).to eq(expected)
    end
  end

  it "keeps the historical assessment year distinct from the current tax year" do
    old = estimate(tax_year: "2025-26")
    current = estimate
    expect(old).to include("period_label" => "FY 2025–26 / AY 2026–27", "governing_act" => "Income-tax Act, 1961")
    expect(current).to include("period_label" => "Tax Year 2026–27", "governing_act" => "Income-tax Act, 2025")
    expect(old["rule_version"]).not_to eq(current["rule_version"])
    expect(old["regimes"]).to eq(current["regimes"])
  end

  { "under_60" => "33800.0", "60_to_79" => "31200.0", "80_plus" => "20800.0" }.each do |age, tax|
    it "uses resident old-regime exemption bands for #{age}" do
      expect(regime(estimate(gross_salary: "650000", age_group: age), "old")["annual_tax"]).to eq(tax)
    end
  end

  it "caps standard deduction by aggregate salary, including a zero-salary year" do
    %w[0 40000].each do |salary|
      %w[old new].each do |name|
        row = regime(estimate(gross_salary: salary), name)
        expect(row).to include("salary_deductions" => BigDecimal(salary).to_s("F"), "taxable_income" => "0.0", "annual_tax" => "0.0")
      end
    end
  end

  it "applies shared investment, distinct pension and separate health caps only in the old regime" do
    result = estimate(gross_salary: "2000000", deductions: {
      "investments" => "120000", "employee_nps" => "30000", "additional_nps" => "50000",
      "personal_nps_paid" => "80000", "pension_salary" => "300000", "professional_tax" => "2500",
      "health_self" => "30000", "health_parents" => "55000", "parents_senior" => true
    })
    expect(regime(result, "old")).to include("salary_deductions" => "52500.0", "chapter_deductions" => "275000.0", "annual_tax" => "326820.0")
    expect(regime(result, "new")).to include("salary_deductions" => "75000.0", "chapter_deductions" => "0.0", "annual_tax" => "192400.0")
    admitted = regime(result, "old").fetch("deductions").index_by { |line| line.fetch("code") }
    expect(admitted["health_self"]["allowed"]).to eq("25000.0")
    expect(admitted["health_parents"]["allowed"]).to eq("50000.0")
  end

  it "limits employee pension to ten percent of qualifying salary before the shared cap" do
    result = estimate(gross_salary: "2000000", deductions: {
      "investments" => "140000", "employee_nps" => "60000", "additional_nps" => "50000",
      "personal_nps_paid" => "110000", "pension_salary" => "100000"
    })
    lines = regime(result, "old").fetch("deductions").index_by { |line| line.fetch("code") }
    expect(lines["employee_nps"]["allowed"]).to eq("10000.0")
    expect(regime(result, "old")["chapter_deductions"]).to eq("200000.0")
  end

  it "rejects personal pension allocations exceeding the stated contributions" do
    expect do
      estimate(deductions: { "employee_nps" => "30000", "additional_nps" => "50000",
        "personal_nps_paid" => "50000", "pension_salary" => "300000" })
    end.to raise_error(ArgumentError, /pension allocations/)
  end

  it "caps mixed employer pension contributions separately and includes them in the salary input" do
    result = estimate(gross_salary: "3000000", employer_pensions: [
      { "contribution" => "150000", "salary_basis" => "1000000", "government" => false },
      { "contribution" => "150000", "salary_basis" => "1000000", "government" => true }
    ])
    expect(regime(result, "old")["chapter_deductions"]).to eq("240000.0")
    expect(regime(result, "new")["chapter_deductions"]).to eq("280000.0")
    expect do
      estimate(gross_salary: "100000", employer_pensions: [
        { "contribution" => "20000", "salary_basis" => "100000", "government" => false }
      ])
    end.to raise_error(ArgumentError, /included in gross salary/)
  end

  it "never admits chapter deductions beyond gross total income" do
    result = estimate(gross_salary: "40000", taxable_interest: "10000", deductions: { "investments" => "150000", "health_self" => "25000" })
    row = regime(result, "old")
    expect(row).to include("chapter_deductions" => "10000.0", "taxable_income" => "0.0")
    expect(row.fetch("deductions").sum { |line| BigDecimal(line.fetch("allowed")) }).to eq(BigDecimal("50000"))
  end

  it "limits eligible interest by source and the resident age band, never by all interest automatically" do
    %w[under_60 60_to_79 80_plus].each do |age|
      result = estimate(gross_salary: "2000000", taxable_interest: "60000", age_group: age, deductions: { "eligible_interest" => "60000" })
      expect(regime(result, "old")["chapter_deductions"]).to eq(age == "under_60" ? "10000.0" : "50000.0")
      expect(regime(result, "new")["chapter_deductions"]).to eq("0.0")
    end
    expect { estimate(taxable_interest: "100", deductions: { "eligible_interest" => "101" }) }.to raise_error(ArgumentError, /interest/)
  end

  it "discards paise before rounding income to ten around the resident rebate boundary" do
    lower = regime(estimate(gross_salary: "1275004.99"), "new")
    upper = regime(estimate(gross_salary: "1275005.00"), "new")
    expect(lower).to include("taxable_income" => "1200000.0", "annual_tax" => "0.0")
    expect(upper).to include("taxable_income" => "1200010.0", "annual_tax" => "10.0", "rebate_marginal_relief" => "59991.5")
  end

  it "provides new-regime rebate marginal relief but does not invent it above the old rebate threshold" do
    expect(regime(estimate(gross_salary: "1300000"), "new")).to include("rebate_marginal_relief" => "38750.0", "annual_tax" => "26000.0")
    expect(regime(estimate(gross_salary: "550010"), "old")).to include("rebate" => "0.0", "rebate_marginal_relief" => "0.0", "annual_tax" => "13000.0")
  end

  { "old" => [5000000, 10000000, 20000000, 50000000], "new" => [5000000, 10000000, 20000000] }.each do |name, thresholds|
    thresholds.each do |threshold|
      it "applies surcharge marginal relief at #{name} taxable income #{threshold}" do
        rows = [-10, 0, 10].map do |delta|
          regime(estimate(gross_salary: (threshold + (name == "new" ? 75000 : 50000) + delta).to_s), name)
        end
        taxes = rows.map { |row| BigDecimal(row.fetch("annual_tax")) }
        expect(taxes).to eq(taxes.sort)
        expect(taxes.last - taxes.first).to be <= 30
        expect(BigDecimal(rows.last.fetch("surcharge_marginal_relief"))).to be_positive
      end
    end
  end

  it "matches the independently derived first surcharge relief total" do
    expect(regime(estimate(gross_salary: "5075010"), "new")).to include("taxable_income" => "5000010.0", "annual_tax" => "1123210.0")
  end

  it "refuses unsupported profiles, currencies, periods and ambiguous input types" do
    [{ scope_confirmed: false }, { eligibility_confirmed: false }, { tax_year: "2027-28" }, { currency: "USD" },
      { age_group: "nonresident" }, { gross_salary: 1275000 }, { gross_salary: "NaN" }, { gross_salary: "1e6" },
      { gross_salary: "-1" }, { gross_salary: "1.001" }, { gross_salary: "1" * 12 }, { taxable_interest: [] },
      { deductions: { "health_self" => "-1" } }, { deductions: { "family_senior" => "false" } },
      { deductions: { "other" => "10000" } }, { deductions: [] }, { capital_gains: "1000" },
      { employer_pensions: Array.new(11) { { "contribution" => "1", "salary_basis" => "10", "government" => false } } },
      { employer_pensions: [{ "contribution" => "1", "salary_basis" => "10", "government" => "false" }] }].each do |changes|
      expect { estimate(**changes) }.to raise_error(ArgumentError), changes.inspect
    end
  end

  it "keeps immutable results and excludes private income values from object inspection" do
    result = estimate
    expect { result.fetch("regimes").fetch("old")["annual_tax"] = "0" }.to raise_error(FrozenError)
    expect(IndiaTax::SalaryEstimate.new({ "gross_salary" => "1234567" }).inspect).not_to include("1234567")
  end
end
