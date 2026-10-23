# frozen_string_literal: true

require "rails_helper"

RSpec.describe "India tax estimates", type: :request do
  let(:company) { create(:company, base_currency: "INR") }
  let(:employee) { create(:user, current_workspace: company) }
  let!(:employment) { create(:employment, company:, user: employee, joined_at: "2026-01-01", resigned_at: nil) }
  let(:inputs) do
    { company_id: company.id, tax_year: "2026-27", currency: "INR", age_group: "under_60",
      gross_salary: "1275000", taxable_interest: "0", deductions: {}, employer_pensions: [],
      scope_confirmed: true, eligibility_confirmed: true }
  end

  before do
    enable_synthetic_payroll(company.id)
    employee.add_role(:employee, company)
    sign_in employee
  end

  def calculate(**changes)
    post "/api/v1/india_tax_estimates", params: { tax_estimate: inputs.merge(changes) }, as: :json
  end

  it "privately calculates supported estimates without changing documents or payroll" do
    expect do
      calculate
    end.not_to change { [TaxDeclaration.count, SalarySlip.count, PayrollRun.count, ActiveStorage::Attachment.count] }
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("estimate").fetch("regimes").fetch("new")["annual_tax"]).to eq("0.0")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.headers["Pragma"]).to eq("no-cache")
    expect(request.filtered_parameters["tax_estimate"]).to eq("[FILTERED]")
  end

  it "authorizes form metadata and exposes a distinct tool capability without changing manual claim semantics" do
    get "/api/v1/india_tax_estimates"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("periods").pluck("value")).to eq(%w[2025-26 2026-27])
    expect(response.body).not_to include(employee.email, employee.full_name)
    get "/api/v1/tax_declarations"
    expect(response.parsed_body).to include("can_estimate_tax" => true, "calculation_enabled" => false)
  end

  it "rejects a stale workspace without calculating against the requested company" do
    calculate(company_id: company.id + 10000)
    expect(response).to have_http_status(:conflict)
    expect(response.parsed_body).not_to have_key("estimate")
  end

  it "rejects malformed roots and unsupported nested fields instead of silently dropping taxable items" do
    ["invalid", [inputs]].each do |payload|
      post "/api/v1/india_tax_estimates", params: { tax_estimate: payload }, as: :json
      expect(response).to have_http_status(:bad_request)
    end
    [{ capital_gains: "100000" }, { deductions: { donation: "10000" } },
      { employer_pensions: [{ contribution: "100", salary_basis: "10000", government: false, exemption_override: true }] },
      { gross_salary: 1275000 }, { eligibility_confirmed: false }, { tax_year: "2027-28" }].each do |changes|
      calculate(**changes)
      expect(response).to have_http_status(:unprocessable_entity), changes.inspect
      expect(response.parsed_body).not_to have_key("estimate")
    end
  end

  it "denies disabled rollout while leaving the manual declaration workflow available" do
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    get "/api/v1/india_tax_estimates"
    expect(response).to have_http_status(:forbidden)
    calculate
    expect(response).to have_http_status(:forbidden)
    get "/api/v1/tax_declarations"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("can_estimate_tax" => false, "calculation_enabled" => false)
  end

  [:resigned, :future_joining, :missing_joining, :discarded, :client_only].each do |state|
    it "denies #{state} staff even with a retained workspace selection" do
      case state
      when :resigned then employment.update_columns(resigned_at: Date.yesterday)
      when :future_joining then employment.update_columns(joined_at: Date.tomorrow)
      when :missing_joining then employment.update_columns(joined_at: nil)
      when :discarded then employee.update_columns(discarded_at: Time.current)
      when :client_only
        employee.remove_role(:employee, company)
        employee.add_role(:client, company)
      end
      expected = state == :discarded ? :unauthorized : :forbidden
      get "/api/v1/india_tax_estimates", headers: { "Accept" => "application/json" }
      expect(response).to have_http_status(expected)
      calculate
      expect(response).to have_http_status(expected)
    end
  end

  it "does not expose estimates or form metadata after logout" do
    sign_out employee
    get "/api/v1/india_tax_estimates"
    expect(response).to have_http_status(:unauthorized)
    calculate
    expect(response).to have_http_status(:unauthorized)
  end

  it "protects cookie-authenticated estimates against CSRF" do
    controller = Api::V1::IndiaTaxEstimatesController
    original = controller.allow_forgery_protection
    controller.allow_forgery_protection = true
    calculate
    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.parsed_body).not_to have_key("estimate")
  ensure
    controller.allow_forgery_protection = original
  end
end
