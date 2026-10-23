# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::CompensationProfitability do
  let(:company) { create(:company, plan_tier: "paid", base_currency: "INR", fiscal_year_end: "March", compensation_proration: "calendar_days") }
  let(:admin) do
    create(:user, confirmed_at: Time.current, current_workspace: company).tap do |user|
      user.add_role(:admin, company)
      create(:employment, company:, user:, joined_at: Date.current, resigned_at: nil)
    end
  end
  let(:person) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: person, joined_at: "2026-01-01", resigned_at: nil) }
  let!(:profile) { ProfitabilityProfile.create!(employment:, weekdays: [1, 2, 3, 4, 5], hours_per_day: 8) }
  let!(:record) do
    EmployeeRecord.create!(employment:, private_details: { "salary_amount" => "3100.00", "salary_currency" => "INR",
      "salary_frequency" => "monthly", "salary_effective_on" => "2026-01-01" })
  end
  let(:client) { create(:client, company:, currency: "USD") }
  let(:project) { create(:project, client:, billable: true) }
  let(:filters) { { period: "custom", from: "2026-07-01", to: "2026-07-31", currency: "INR" } }

  before { ExchangeRate.set_rate("USD", "INR", 80, Date.new(2026, 1, 1), "synthetic") }

  def report(**overrides)
    described_class.new(user: admin, company:, filters: filters.merge(overrides)).process
  end

  def row(**overrides)
    report(**overrides).fetch(:people).find { |item| item[:person_id] == person.id }
  end

  def entry(date: "2026-07-01", duration: 480, review_status: "approved", bill_status: "unbilled", project_record: project)
    create(:timesheet_entry, user: person, project: project_record, work_date: date, duration:, review_status:, bill_status:)
  end

  def rate(amount: 100, effective_on: "2026-01-01", project_record: project, currency: "USD", billing_method: "hourly")
    ProfitabilityBillingRate.create!(project: project_record, user: person, hourly_rate: amount, currency:, effective_on:, billing_method:)
  end

  it "includes people with costs and no projects, retains negative margins and uses N/A for zero-revenue percentages" do
    result = row
    expect(result).to include(compensation_cost: 3100.to_d, salary_inr: 3100.to_d, salary_usd: 38.75.to_d,
      revenue: 0.to_d, margin: -3100.to_d, margin_percentage: nil, days_to_yearly_salary: nil,
      annual_compensation: 37_200.to_d, available_hours: 184.to_d)
    expect(result[:flags]).to include("missing_timesheets")
  end

  it "uses dated project rates, all projects, approved billable time and same-currency amounts" do
    rate
    rate(amount: 200, effective_on: "2026-07-16")
    entry
    entry(date: "2026-07-16")
    entry(date: "2026-07-02", bill_status: "non_billable")
    entry(review_status: "pending_review")
    entry(review_status: "not_required")
    other = create(:project, client:, billable: true)
    rate(amount: 8000, project_record: other, currency: "INR")
    entry(project_record: other)
    profile.update!(primary_project: other)
    result = row
    expect(result).to include(total_hours: 32.to_d, billable_hours: 24.to_d, revenue: 256_000.to_d,
      primary_project_id: other.id, margin: 252_900.to_d)
    expect(result[:effective_rate]).to be_within(0.001).of(256_000.to_d / 24)
    expect(result[:flags]).to include("unapproved_hours_excluded")
    expect(result[:projects].size).to eq(2)
    expect(report[:exchange_rates]).to include(hash_including(from: "USD", to: "INR", date: "2026-01-01", source: "synthetic", rate: 80.to_d))
    expect(row(primary_project_id: other.id)[:revenue]).to eq(256_000.to_d)
    expect(row(client_id: client.id)[:revenue]).to eq(256_000.to_d)
  end

  it "preserves salary changes and prorates each dated amount, joining and exit inclusively" do
    record.update!(private_details: record.private_details.merge("salary_amount" => "6200.00", "salary_effective_on" => "2026-07-16"))
    expect(employment.compensation_versions.count).to eq(2)
    expect(row).to include(compensation_cost: 4700.to_d, annual_compensation: 74_400.to_d)
    employment.update!(joined_at: "2026-07-10", resigned_at: "2026-07-20")
    expect(row[:compensation_cost]).to eq(1600.to_d)
    expect(row[:compensation_changes].size).to eq(2)
  end

  it "uses annual compensation without multiplying it by twelve" do
    record.update!(private_details: record.private_details.merge("salary_amount" => "37200.00", "salary_frequency" => "annual"))
    expect(row).to include(annual_compensation: 37_200.to_d, compensation_cost: 3100.to_d)
    record.update!(private_details: record.private_details.merge("salary_amount" => "100000.00"))
    expect(row[:annual_compensation]).to eq(100_000.to_d)
  end

  it "keeps one row per person and flags repeated employment records rather than double-counting" do
    create(:employment, company:, user: person, joined_at: "2026-01-01", resigned_at: nil)
    result = report
    expect(result[:people].size).to eq(1)
    expect(result[:people].first[:flags]).to include("multiple_employment_records_require_review")
    expect(result[:summary][:gross_compensation_burn]).to be_nil
    expect(result[:summary][:overall_utilization]).to be_nil
  end

  it "preserves manually corrected history when the mutable current salary is edited later" do
    employment.compensation_versions.create!(effective_on: "2026-01-01",
      salary_details: record.private_details.merge("salary_amount" => "6200.00"))
    record.update!(private_details: record.private_details.merge("salary_amount" => "9300.00", "salary_effective_on" => "2026-10-01"))
    expect(row[:compensation_cost]).to eq(6200.to_d)
  end

  it "does not invent a salary effective date when the private record is incomplete" do
    record.update!(private_details: record.private_details.merge("salary_effective_on" => nil))
    result = row(period: "month", anchor: Date.current.iso8601)
    expect(result[:compensation_cost]).to be_nil
    expect(result[:flags]).to include("missing_compensation")
  end

  it "uses a newly dated salary after an undated salary is corrected retroactively" do
    record.update!(private_details: record.private_details.merge("salary_effective_on" => nil))
    expect do
      record.update!(private_details: record.private_details.merge("salary_amount" => "6200.00", "salary_effective_on" => "2026-07-01"))
    end.to change { employment.compensation_versions.count }.by(1)
    expect(row(period: "month", anchor: Date.current.iso8601)[:compensation_cost]).to eq(6200.to_d)
    expect(row[:compensation_cost]).to eq(6200.to_d)
  end

  it "retains employee salary before a transition into dated consultant compensation" do
    enable_synthetic_payroll(company.id)
    employment.consultant_compensations.create!(effective_on: "2026-08-01", monthly_fee: "6200.00", hours_per_day: "8.00",
      weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Synthetic", change_reason: "Synthetic transition", created_by: admin)
    expect(row[:compensation_cost]).to eq(3100.to_d)
    expect(row(period: "month", anchor: "2026-08-01")[:compensation_cost]).to eq(6200.to_d)
  end

  it "keeps cost-only people visible when filtering their designated primary project's client" do
    profile.update!(primary_project: project)
    expect(row(client_id: client.id)).to include(revenue: 0.to_d, compensation_cost: 3100.to_d)
  end

  it "captures project rate and currency edits from their recording date without auditing the amount" do
    member = create(:project_member, project:, user: person, hourly_rate: 10)
    member.update!(hourly_rate: 20)
    client.update!(currency: "INR")
    rates = ProfitabilityBillingRate.where(project:, user: person).order(:id)
    expect(rates.pluck(:hourly_rate, :currency)).to eq([[10.to_d, "USD"], [20.to_d, "USD"], [20.to_d, "INR"]])
    expect(rates.pluck(:effective_on).uniq).to eq([Date.current])
    expect(rates.last.audits.last.audited_changes).not_to have_key("hourly_rate")
    expect(row[:revenue]).to eq(0.to_d)
  end

  it "captures an intentional zero-rate edit while leaving unconfigured default rates unavailable" do
    member = create(:project_member, project:, user: person, hourly_rate: 100)
    member.update!(hourly_rate: 0)
    expect(ProfitabilityBillingRate.where(project:, user: person).order(:id).last.hourly_rate).to eq(0)
    entry(date: Date.current)
    result = row(period: "month", anchor: Date.current.iso8601)
    expect(result[:revenue]).to eq(0)
    expect(result[:flags]).not_to include("missing_effective_billing_rate")
    other = create(:project, client:, billable: true)
    create(:project_member, project: other, user: person, hourly_rate: 0)
    expect(ProfitabilityBillingRate.where(project: other, user: person)).to be_empty
  end

  it "flags missing compensation, missing FX, missing rates, schedule and payroll policy instead of zero" do
    entry
    result = row
    expect(result[:revenue]).to be_nil
    expect(result[:flags]).to include("missing_effective_billing_rate")
    record.update!(private_details: record.private_details.merge("salary_effective_on" => "2026-08-01"))
    # The earlier dated salary still applies until the new version takes effect.
    expect(row[:compensation_cost]).to eq(3100.to_d)
    employment.compensation_versions.delete_all
    expect(row[:compensation_cost]).to be_nil
    expect(row[:flags]).to include("missing_compensation")
    profile.destroy!
    company.update!(compensation_proration: nil)
    ExchangeRate.delete_all
    result = row
    expect(result[:available_hours]).to be_nil
    expect(result[:flags]).to include("missing_working_schedule", "missing_payroll_proration_policy")
  end

  it "does not use future exchange rates or lose a known native cost when a conversion is missing" do
    ExchangeRate.delete_all
    ExchangeRate.set_rate("USD", "INR", 90, Date.new(2026, 8, 1), "future")
    expect(row).to include(salary_inr: 3100.to_d, salary_usd: nil, compensation_cost: 3100.to_d)
    expect(row[:flags]).to include("missing_exchange_rate_INR_USD")
  end

  it "flags fixed-fee revenue and margin as unavailable without an allocation method" do
    rate(amount: nil, billing_method: "fixed_fee")
    entry
    expect(row).to include(revenue: nil, margin: nil, margin_percentage: nil)
    expect(row[:flags]).to include("fixed_fee_allocation_unavailable")
    expect(report[:summary][:overall_margin]).to be_nil
  end

  it "derives margin and utilization from aggregate values" do
    rate
    entry
    other = create(:user, current_workspace: company)
    other_employment = create(:employment, company:, user: other, joined_at: "2026-07-01", resigned_at: nil)
    ProfitabilityProfile.create!(employment: other_employment, weekdays: [1, 2, 3, 4, 5], hours_per_day: 4)
    EmployeeRecord.create!(employment: other_employment, private_details: record.private_details)
    result = report
    expect(result[:summary][:overall_utilization]).to be_within(0.001).of(8.to_d / 276 * 100)
    expect(result[:summary][:overall_margin_percentage]).to be_within(0.001).of((64_000.to_d - 6200) / 64_000 * 100)
    expect(result[:summary][:net_compensation_burn]).to eq(-57_800.to_d)
  end

  it "uses working-day proration only with the configured policy" do
    company.update!(compensation_proration: "working_days")
    expect(row(from: "2026-07-01", to: "2026-07-01")[:compensation_cost]).to be_within(0.0001).of(3100.to_d / 23)
    expect(row[:compensation_cost]).to be_within(0.0001).of(3100)
  end

  it "adjusts for holidays without double subtracting a recorded holiday" do
    holiday = create(:holiday, company:, year: 2026, holiday_types: ["national"])
    create(:holiday_info, holiday:, category: :national, date: "2026-07-01")
    expect(row[:available_hours]).to eq(176.to_d)
    expect(row[:compensation_cost]).to eq(3100.to_d)
  end

  it "flags recorded leave without an approval state and withholds finalized utilization" do
    leave = create(:leave, company:)
    leave_type = create(:leave_type, leave:)
    create(:timeoff_entry, user: person, leave_type:, leave_date: "2026-07-01", duration: 240)
    expect(row).to include(available_hours: nil, utilization: nil)
    expect(row[:flags]).to include("leave_approval_unavailable")
  end

  it "supports fiscal, quarter and leap-year comparisons and validates reporting ranges" do
    result = report(period: "financial_year", anchor: "2026-07-01")
    expect(result).to include(from: "2026-04-01", to: "2027-03-31")
    expect(result[:comparison]).to include(from: "2025-04-01", to: "2026-03-31")
    expect(report(period: "quarter", anchor: "2026-07-01")[:comparison]).to include(from: "2026-04-01", to: "2026-06-30")
    expect(report(period: "month", anchor: "2024-03-01")[:comparison]).to include(from: "2024-02-01", to: "2024-02-29")
    expect { report(from: "2026-07-31", to: "2026-07-01") }.to raise_error(described_class::InvalidFilters)
    expect { report(currency: "EUR") }.to raise_error(described_class::InvalidFilters)
    expect { report(from: "bad") }.to raise_error(described_class::InvalidFilters)
  end

  it "keeps February financial years aligned across leap years and rejects missing configuration" do
    company.fiscal_year_end = "February"
    expect(report(period: "financial_year", anchor: "2027-03-01")).to include(from: "2027-03-01", to: "2028-02-29")
    expect(report(period: "financial_year", anchor: "2028-03-01")).to include(from: "2028-03-01", to: "2029-02-28")
    company.fiscal_year_end = nil
    expect { report(period: "financial_year") }.to raise_error(described_class::InvalidFilters, "Configure the financial year end month")
  end

  it "denies the underlying query before loading data for unauthorized roles and other workspaces" do
    expect { described_class.new(user: person, company:, filters:) }.to raise_error(Pundit::NotAuthorizedError)
    expect { described_class.new(user: admin, company: create(:company), filters:) }.to raise_error(Pundit::NotAuthorizedError)
  end
end
