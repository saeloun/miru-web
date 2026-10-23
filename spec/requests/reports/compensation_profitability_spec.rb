# frozen_string_literal: true

require "rails_helper"
require "csv"

RSpec.describe "Organization compensation profitability", type: :request do
  let(:company) { create(:company, plan_tier: "paid", compensation_proration: "calendar_days") }
  let(:admin) { create(:user, confirmed_at: Time.current, current_workspace: company) }
  let(:person) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: person, joined_at: "2026-01-01", resigned_at: nil) }
  let!(:admin_employment) { create(:employment, company:, user: admin, joined_at: Date.current, resigned_at: nil) }
  let(:path) { "/reports/compensation-profitability" }

  before do
    admin.add_role(:admin, company)
    EmployeeRecord.create!(employment:, private_details: { "salary_amount" => "3100.00", "salary_currency" => "INR",
      "salary_frequency" => "monthly", "salary_effective_on" => "2026-01-01" })
    ProfitabilityProfile.create!(employment:, weekdays: [1, 2, 3, 4, 5], hours_per_day: 8)
    sign_in admin
  end

  def generate
    get "#{path}.json", params: { period: "month", anchor: "2026-07-01", currency: "INR" }
    expect(response).to have_http_status(:ok)
    response.parsed_body
  end

  it "renders the report, controls, expansion and private no-store headers" do
    get path
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Annual Compensation", "Previous equivalent period", "Inspect #{person.full_name}", "Download CSV")
    expect(response.body).to include("Organization owners and admins only", "← Reports", company.name)
    expect(response.body).not_to include("Super Admins only", "/admin/compensation-profitability")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["X-Robots-Tag"]).to eq("noindex, nofollow")
  end

  it "encrypts snapshots, audits generation and downloads the same snapshot after data changes" do
    payload = generate
    run = CompensationReportRun.last
    raw = CompensationReportRun.connection.select_value("SELECT payload FROM compensation_report_runs WHERE id = #{run.id}")
    expect(raw).not_to include(person.full_name, "3100")
    expect(run.audits.last.audited_changes.to_json).not_to include(person.full_name, "3100")
    expect(run.created_by).to eq(admin)
    EmployeeRecord.find_by!(employment:).update!(private_details: { "salary_amount" => "9999.00" })
    get payload.fetch("export_url")
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("text/csv")
    rows = CSV.parse(response.body)
    header_index = rows.index { |row| row.first == "Primary Project" }
    result = rows[header_index + 1]
    expect(result[15]).to eq("3100.0")
    expect(response.body).not_to include("9999")
    expect(run.audits.last.action).to eq("export")
  end

  %w[owner admin].each do |role|
    it "allows an active organization #{role} without platform Super Admin access" do
      person.add_role(role.to_sym, company)
      sign_in person
      expect(person).not_to be_super_admin
      payload = generate
      expect(payload.fetch("export_url")).to start_with("#{path}/exports/")
      get payload.fetch("export_url")
      expect(response).to have_http_status(:ok)
      post "#{path}/configure", params: { company_id: company.id, configuration: "policy", compensation_proration: "working_days" }
      expect(response).to redirect_to(path)
      expect(company.reload.compensation_proration).to eq("working_days")
    end
  end

  %w[manager employee book_keeper client].each do |role|
    it "blocks #{role} from the report, JSON, configuration and direct export downloads" do
      payload = generate
      person.add_role(role.to_sym, company)
      sign_in person
      get path
      expect(response).not_to have_http_status(:ok)
      get "#{path}.json"
      expect(response).to have_http_status(:forbidden)
      get payload.fetch("export_url")
      expect(response).not_to have_http_status(:ok)
      post "#{path}/configure", params: { company_id: company.id, configuration: "policy", compensation_proration: "working_days" }
      expect(response).not_to have_http_status(:see_other)
      expect(company.reload.compensation_proration).to eq("calendar_days")
      get "/admin/compensation-profitability.json"
      expect(response).to have_http_status(:forbidden)
    end
  end

  it "rejects revoked roles, inactive employment and free plans on existing exports" do
    payload = generate
    admin.remove_role(:admin, company)
    get payload.fetch("export_url")
    expect(response).not_to have_http_status(:ok)
    admin.add_role(:admin, company)
    admin_employment.update!(joined_at: 2.days.ago.to_date, resigned_at: Date.yesterday)
    get "#{path}.json"
    expect(response).to have_http_status(:forbidden)
    admin_employment.update_columns(resigned_at: nil, joined_at: Date.tomorrow)
    get "#{path}.json"
    expect(response).to have_http_status(:forbidden)
    admin_employment.update!(joined_at: Date.current, discarded_at: Time.current)
    get payload.fetch("export_url")
    expect(response).not_to have_http_status(:ok)
    admin_employment.undiscard!
    company.update!(plan_tier: "free", trial_started_at: nil)
    get payload.fetch("export_url")
    expect(response).not_to have_http_status(:ok)
  end

  it "grants no platform Super Admin bypass or cross-organization role access" do
    admin.update_column(:email, "hello@saeloun.com")
    admin.remove_role(:admin, company)
    admin.add_role(:owner, create(:company))
    expect(admin).to be_super_admin
    get "#{path}.json"
    expect(response).to have_http_status(:forbidden)
    expect(CompensationReportRun.count).to eq(0)
  end

  it "keeps legacy report and export URLs protected by the organization policy" do
    get "/admin/compensation-profitability.json"
    expect(response).to have_http_status(:ok)
    token = response.parsed_body.fetch("export_url").split("/").last
    get "/admin/compensation-profitability/exports/#{token}"
    expect(response).to have_http_status(:ok)
    admin.remove_role(:admin, company)
    get "/admin/compensation-profitability/exports/#{token}"
    expect(response).not_to have_http_status(:ok)
    post "/admin/compensation-profitability/configure", params: { company_id: company.id, configuration: "policy", compensation_proration: "working_days" }
    expect(response).not_to have_http_status(:see_other)
    expect(company.reload.compensation_proration).to eq("calendar_days")
  end

  it "requires authentication and rejects expired, modified and wrong-workspace links" do
    payload = generate
    url = payload.fetch("export_url")
    get "#{url}x"
    expect(response).to have_http_status(:not_found)
    travel 16.minutes do
      get url
      expect(response).to have_http_status(:not_found)
    end
    other_company = create(:company, plan_tier: "paid")
    admin.add_role(:owner, other_company)
    create(:employment, user: admin, company: other_company, resigned_at: nil)
    admin.update!(current_workspace: other_company)
    get url
    expect(response).to have_http_status(:not_found)
    sign_out admin
    get url
    expect(response).not_to have_http_status(:ok)
  end

  it "scopes configuration to the workspace, validates policies and audits compensation without salary amounts" do
    post "#{path}/configure", params: { company_id: company.id, configuration: "policy", compensation_proration: "unknown" }
    expect(response).to have_http_status(:unprocessable_entity)
    foreign = create(:employment)
    post "#{path}/configure", params: { company_id: company.id, configuration: "profile", employment_id: foreign.id,
      profitability_profile: { department: "Private" } }
    expect(response).to have_http_status(:not_found)
    post "#{path}/configure", params: { company_id: company.id, configuration: "compensation", employment_id: employment.id,
      salary_details: { salary_amount: "6200.00", salary_currency: "INR", salary_frequency: "monthly", salary_effective_on: "2026-07-16" } }
    expect(response).to have_http_status(:see_other)
    expect(employment.compensation_versions.count).to eq(2)
    audit = company.audits.last
    expect(audit.action).to eq("compensation_history")
    expect(audit.audited_changes.to_json).not_to include("6200")
  end

  it "rejects configuration from a stale organization tab before making changes" do
    other_company = create(:company, plan_tier: "paid", compensation_proration: "calendar_days")
    admin.add_role(:owner, other_company)
    create(:employment, company: other_company, user: admin, resigned_at: nil)
    admin.update!(current_workspace: other_company)
    post "#{path}/configure", params: { company_id: company.id, configuration: "policy", compensation_proration: "working_days" }
    expect(response).to have_http_status(:conflict)
    expect([company.reload.compensation_proration, other_company.reload.compensation_proration]).to eq(%w[calendar_days calendar_days])
    post "#{path}/configure", params: { configuration: "policy", compensation_proration: "working_days" }
    expect(response).to have_http_status(:conflict)
  end

  it "escapes spreadsheet formulas in names without changing numeric negative margins" do
    person.update_column(:first_name, "=1+1")
    payload = generate
    get payload.fetch("export_url")
    expect(response.body).to include("'=1+1")
    expect(response.body).to include("-3100.0")
  end

  it "keeps four-decimal billing rates visible on screen and in the CSV" do
    project = create(:project, client: create(:client, company:, currency: "INR"), billable: true)
    ProfitabilityBillingRate.create!(project:, user: person, effective_on: "2026-01-01", hourly_rate: "18.1234", currency: "INR")
    create(:timesheet_entry, project:, user: person, work_date: "2026-07-01", duration: 60, bill_status: "unbilled", review_status: "approved")
    get path, params: { period: "month", anchor: "2026-07-01" }
    expect(response.body).to include("INR 18.1234")
    expect(response.body).to include("INR 3,100.00")
    payload = generate
    get payload.fetch("export_url")
    expect(response.body).to include("18.1234")
  end

  it "labels future comparison periods as provisional in the HTML and CSV" do
    get path, params: { period: "month", anchor: 2.months.from_now.to_date.iso8601 }
    expect(response.body.scan("Provisional — period includes future dates").size).to eq(2)
    get "#{path}.json", params: { period: "month", anchor: 2.months.from_now.to_date.iso8601 }
    get response.parsed_body.fetch("export_url")
    expect(CSV.parse(response.body).select { |row| row.first == "Summary" }.last).to include("Provisional", "true")
  end
end
