# frozen_string_literal: true

require "rails_helper"
require "csv"

RSpec.describe "Organization profitability planning", type: :request do
  let(:company) { create(:company, plan_tier: "paid") }
  let(:admin) { create(:user, confirmed_at: Time.current, current_workspace: company) }
  let(:path) { "/reports/profitability-planning" }
  let(:assumptions) do
    { currency: "USD", start_month: "2026-11-01", months: "12", reserve_months: "3", opening_cash: "1000", monthly_collections: "2000",
      people: [{ name: "=Private planning name", capacity_hours: "160", utilization: "80", billing_rate: "50", monthly_compensation: "3000" }],
      overheads: [{ name: "Software", monthly_amount: "500" }] }
  end

  before do
    admin.add_role(:admin, company)
    create(:employment, company:, user: admin, joined_at: Date.current, resigned_at: nil)
    sign_in admin
  end

  def create_plan
    post path, params: { profitability_scenario: { company_id: company.id, name: "Baseline plan", assumptions: } }
    expect(response).to have_http_status(:see_other)
    ProfitabilityScenario.last
  end

  it "saves encrypted assumptions without writing payroll, and preserves its first saved baseline" do
    plan = create_plan
    raw = ProfitabilityScenario.connection.select_value("SELECT worksheet FROM profitability_scenarios WHERE id = #{plan.id}")
    expect(raw).not_to include("Private planning name", "3000")
    expect(plan.audits.last.audited_changes.to_json).not_to include("3000", "Private planning name")
    expect(plan.worksheet.fetch("baseline")).to eq(plan.worksheet.fetch("assumptions"))
    changed = assumptions.deep_dup
    changed[:people].first[:billing_rate] = "60"
    patch "#{path}/#{plan.id}", params: { profitability_scenario: { company_id: company.id, name: plan.name, lock_version: plan.lock_version,
      assumptions: changed, baseline: changed } }
    expect(response).to have_http_status(:see_other)
    expect(plan.reload.worksheet.dig("baseline", "people", 0, "billing_rate")).to eq("50")
    expect(plan.worksheet.dig("assumptions", "people", 0, "billing_rate")).to eq("60")
    expect(EmployeeRecord.count).to eq(0)
    get "#{path}/#{plan.id}"
    expect(response.body).to include("Baseline plan", "First saved baseline", "Projected monthly revenue")
    expect(response.headers["Cache-Control"]).to include("no-store")
  end

  it "previews without saving, flags blanks and rejects invalid input" do
    post "#{path}/preview", params: { profitability_scenario: { company_id: company.id, assumptions: } }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("summary", "revenue").to_d).to eq(6400.to_d)
    expect(ProfitabilityScenario.count).to eq(0)
    assumptions[:people].first[:monthly_compensation] = ""
    post "#{path}/preview", params: { profitability_scenario: { company_id: company.id, assumptions: } }
    expect(response.parsed_body.dig("summary", "cost")).to be_nil
    assumptions[:people].first[:utilization] = "101"
    post "#{path}/preview", params: { profitability_scenario: { company_id: company.id, assumptions: } }
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it "prevents concurrent edits and currency relabelling of an existing baseline" do
    plan = create_plan
    plan.update!(name: "Another admin saved this")
    patch "#{path}/#{plan.id}", params: { profitability_scenario: { company_id: company.id, name: "Stale changes", lock_version: 0, assumptions: } }
    expect(response).to have_http_status(:conflict)
    expect(plan.reload.name).to eq("Another admin saved this")
    expect(response.body).to include("Stale changes", "Another edit was saved")
    patch "#{path}/#{plan.id}", params: { profitability_scenario: { company_id: company.id, name: plan.name, lock_version: plan.lock_version,
      assumptions: assumptions.merge(currency: "INR") } }
    expect(response).to have_http_status(:unprocessable_entity)
    expect(plan.reload.worksheet.dig("assumptions", "currency")).to eq("USD")
  end

  it "scopes saved plans to the current company for reads, edits and expiring exports" do
    plan = create_plan
    get "#{path}/#{plan.id}"
    url = Nokogiri::HTML(response.body).at_css("a[data-planning-export]")["href"]
    other = create(:company, plan_tier: "paid")
    admin.update!(current_workspace: other)
    admin.add_role(:owner, other)
    create(:employment, company: other, user: admin, joined_at: Date.current, resigned_at: nil)
    get "#{path}/#{plan.id}"
    expect(response).to have_http_status(:not_found)
    patch "#{path}/#{plan.id}", params: { profitability_scenario: { company_id: other.id, name: "Cross tenant", lock_version: 0, assumptions: } }
    expect(response).to have_http_status(:not_found)
    get url
    expect(response).to have_http_status(:not_found)
  end

  it "exports calculated saved values safely and expires generated links" do
    plan = create_plan
    get "#{path}/#{plan.id}"
    url = Nokogiri::HTML(response.body).at_css("a[data-planning-export]")["href"]
    get url
    expect(response.media_type).to eq("text/csv")
    expect(CSV.parse(response.body).flatten).to include("'=Private planning name", "6400.0")
    expect(plan.audits.last.action).to eq("export")
    travel 16.minutes do
      get url
      expect(response).to have_http_status(:not_found)
    end
  end

  it "denies bookkeepers, employees and platform super admins without the organization role" do
    %i[book_keeper employee super_admin].each do |role|
      admin.remove_role(:admin, company)
      role == :super_admin ? admin.add_role(role) : admin.add_role(role, company)
      get path
      expect(response).not_to have_http_status(:ok)
      get "#{path}.json"
      expect(response).to have_http_status(:forbidden)
      post "#{path}/preview", params: { profitability_scenario: { assumptions: } }, headers: { "Accept" => "application/json" }
      expect(response).to have_http_status(:forbidden)
      role == :super_admin ? admin.remove_role(role) : admin.remove_role(role, company)
    end
  end

  it "retains invalid edits on save and does not export a newer version through an old link" do
    plan = create_plan
    get "#{path}/#{plan.id}"
    url = Nokogiri::HTML(response.body).at_css("a[data-planning-export]")["href"]
    changed = assumptions.deep_dup
    changed[:people].first[:utilization] = "101"
    patch "#{path}/#{plan.id}", params: { profitability_scenario: { company_id: company.id, name: "Retained edit", lock_version: plan.lock_version, assumptions: changed } }
    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.body).to include("Retained edit", 'value="101"')
    expect(plan.reload.name).to eq("Baseline plan")
    plan.update!(name: "New version")
    get url
    expect(response).to have_http_status(:not_found)
    sign_out admin
    get "#{path}.json"
    expect(response).to have_http_status(:unauthorized)
  end

  it "rejects saving or previewing a worksheet after the workspace changes in another tab" do
    original_id = company.id
    other = create(:company, plan_tier: "paid")
    admin.add_role(:owner, other)
    create(:employment, user: admin, company: other, joined_at: Date.current, resigned_at: nil)
    admin.update!(current_workspace: other)
    [path, "#{path}/preview"].each do |url|
      post url, params: { profitability_scenario: { company_id: original_id, name: "Wrong workspace", assumptions: } }
      expect(response).to have_http_status(:conflict)
    end
    expect(ProfitabilityScenario.count).to eq(0)
  end

  it "filters the entire confidential worksheet from request parameters" do
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    expect(filter.filter("profitability_scenario" => { "assumptions" => assumptions })).to eq("profitability_scenario" => "[FILTERED]")
  end

  it "retains signed source history and warnings when the forecast dates change" do
    get "#{path}/new?currency=USD"
    document = Nokogiri::HTML(response.body)
    token = document.at_css('input[name="profitability_scenario[source_token]"]')["value"]
    travel 2.days do
      post path, params: { profitability_scenario: { company_id: company.id, name: "Seeded", source_token: token, assumptions: } }
    end
    expect(response).to have_http_status(:see_other)
    plan = ProfitabilityScenario.last
    source = plan.worksheet.fetch("source").deep_dup
    expect(source.fetch("people").first.fetch("flags")).to include("missing_compensation")
    expect(source.fetch("from")).to eq(Date.current.beginning_of_month.iso8601)
    patch "#{path}/#{plan.id}", params: { profitability_scenario: { company_id: company.id, name: plan.name,
      lock_version: plan.lock_version, assumptions: assumptions.merge(start_month: "2027-01-01") } }
    expect(response).to have_http_status(:see_other)
    expect(plan.reload.worksheet.fetch("source")).to eq(source)
    expect(Reports::ProfitabilityPlanCsv.process(plan)).to include("Source captured", "missing_compensation")
    post path, params: { profitability_scenario: { company_id: company.id, name: "Tampered", source_token: "#{token}x", assumptions: } }
    expect(response).to have_http_status(:not_found)
    expect(ProfitabilityScenario.count).to eq(1)
  end
end
