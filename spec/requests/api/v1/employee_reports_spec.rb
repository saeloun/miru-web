# frozen_string_literal: true

require "rails_helper"
require "csv"

RSpec.describe "Employee reports and settings", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace: company) }
  let(:employee) { create(:user, current_workspace: company) }
  let!(:admin_employment) { create(:employment, company:, user: admin, resigned_at: nil) }
  let!(:employment) { create(:employment, company:, user: employee, resigned_at: nil) }

  before do
    enable_synthetic_payroll(company.id)
    admin.add_role(:admin, company)
    employee.add_role(:employee, company)
    sign_in admin
  end

  def save_report(**attributes)
    post "/api/v1/employee_reports", params: {
      employee_report: { company_id: company.id, name: "Insurance", columns: %w[name family_members] }.merge(attributes)
    }, as: :json
  end

  it "lists source-defined metadata, saves only definitions, updates and deletes" do
    get "/api/v1/employee_reports"
    expect(response.parsed_body).to include("employee_reports" => [], "company_id" => company.id)
    expect(response.parsed_body.fetch("presets").fetch("insurance")).to include("family_members")
    expect(response.parsed_body.fetch("columns").first.keys).to eq(%w[key label description])
    save_report
    expect(response).to have_http_status(:created)
    report = EmployeeReport.last
    expect(report.attributes.keys).to match_array(%w[id company_id name columns created_at updated_at])
    patch "/api/v1/employee_reports/#{report.id}", params: {
      employee_report: { company_id: company.id, name: "Salary", columns: ["salary_currency"] }
    }, as: :json
    expect(response.parsed_body.fetch("employee_report")).to include("name" => "Salary", "columns" => ["salary_currency"])
    delete "/api/v1/employee_reports/#{report.id}", params: { employee_report: { company_id: company.id } }, as: :json
    expect(response).to have_http_status(:no_content)
    expect(EmployeeReport.exists?(report.id)).to be(false)
  end

  it "rejects stale company identity, unlisted/duplicate/malformed columns and empty names" do
    save_report(company_id: nil)
    expect(response).to have_http_status(:conflict)
    save_report(columns: ["password"])
    expect(response).to have_http_status(422)
    save_report(columns: %w[name name])
    expect(response).to have_http_status(422)
    save_report(columns: "name")
    expect(response).to have_http_status(:bad_request)
    save_report(name: "")
    expect(response).to have_http_status(422)
    expect(EmployeeReport.count).to eq(0)
  end

  it "downloads private formula-safe CSV of active staff, excluding other companies and clients" do
    employee.update_column(:first_name, "=SUM(A1)")
    EmployeeRecord.create!(employment:, private_details: { "bank_account_number" => "12345678" })
    other = create(:company)
    other_user = create(:user, current_workspace: other)
    create(:employment, company: other, user: other_user, resigned_at: nil)
    client = create(:user, current_workspace: company)
    create(:employment, company:, user: client, resigned_at: nil)
    client.add_role(:client, company)
    save_report(columns: %w[name bank_account_number])
    get "/api/v1/employee_reports/#{EmployeeReport.last.id}/download", params: { month: "2026-10" }
    expect(response).to have_http_status(:ok)
    expect(CSV.parse(response.body).size).to eq(3)
    expect(response.body).to include("'=SUM(A1)", "12345678")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
    expect(response.headers["Content-Disposition"]).to include("attachment")
    expect(EmployeeReport.last.audits.last.audited_changes).to eq({})
    get "/api/v1/employee_reports/#{EmployeeReport.last.id}/download", params: { month: "2026-13" }
    expect(response).to have_http_status(:bad_request)
  end

  it "scopes every saved-report action to the current company" do
    foreign = EmployeeReport.create!(company: create(:company), name: "Other", columns: ["name"])
    get "/api/v1/employee_reports/#{foreign.id}/download", params: { month: "2026-10" }
    expect(response).to have_http_status(:not_found)
    patch "/api/v1/employee_reports/#{foreign.id}", params: {
      employee_report: { company_id: company.id, name: "Changed" }
    }, as: :json
    expect(response).to have_http_status(:not_found)
    delete "/api/v1/employee_reports/#{foreign.id}", params: { employee_report: { company_id: company.id } }, as: :json
    expect(response).to have_http_status(:not_found)
  end

  it "defaults reminders off without inserting settings and accepts only an explicit boolean opt-in" do
    get "/api/v1/employee_record_settings"
    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body).to eq("employee_record_setting" => {
      "company_id" => company.id, "occasion_reminders_enabled" => false })
    expect(EmployeeRecordSetting.count).to eq(0)
    patch "/api/v1/employee_record_settings", params: {
      employee_record_setting: { company_id: company.id, occasion_reminders_enabled: "true" }
    }, as: :json
    expect(response).to have_http_status(422)
    patch "/api/v1/employee_record_settings", params: {
      employee_record_setting: { company_id: company.id, occasion_reminders_enabled: true }
    }, as: :json
    expect(response.parsed_body.fetch("employee_record_setting")).to include("occasion_reminders_enabled" => true)
    patch "/api/v1/employee_record_settings", params: {
      employee_record_setting: { company_id: company.id + 1, occasion_reminders_enabled: false }
    }, as: :json
    expect(response).to have_http_status(:conflict)
    expect(EmployeeRecordSetting.last.occasion_reminders_enabled).to be(true)
  end

  it "denies staff, inactive admins, cross-company roles and a disabled entitlement" do
    sign_in employee
    get "/api/v1/employee_reports"
    expect(response).to have_http_status(:forbidden)
    get "/api/v1/employee_record_settings"
    expect(response).to have_http_status(:forbidden)
    sign_in admin
    admin.remove_role(:admin, company)
    admin.add_role(:admin, create(:company))
    get "/api/v1/employee_reports"
    expect(response).to have_http_status(:forbidden)
    admin.add_role(:admin, company)
    admin_employment.update_column(:resigned_at, Date.yesterday)
    get "/api/v1/employee_reports"
    expect(response).to have_http_status(:forbidden)
    admin_employment.update_column(:resigned_at, nil)
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    get "/api/v1/employee_record_settings"
    expect(response).to have_http_status(:forbidden)
  end

  it "requires CSRF for cookie-authenticated report and reminder mutations" do
    controllers = [Api::V1::EmployeeReportsController, Api::V1::EmployeeRecordSettingsController]
    originals = controllers.map(&:allow_forgery_protection)
    controllers.each { |controller| controller.allow_forgery_protection = true }
    save_report
    expect(response).to have_http_status(422)
    sign_in admin
    patch "/api/v1/employee_record_settings", params: {
      employee_record_setting: { company_id: company.id, occasion_reminders_enabled: true }
    }, as: :json
    expect(response).to have_http_status(422)
    expect(EmployeeReport.count).to eq(0)
    expect(EmployeeRecordSetting.count).to eq(0)
  ensure
    controllers.zip(originals).each { |controller, original| controller.allow_forgery_protection = original }
  end
end
