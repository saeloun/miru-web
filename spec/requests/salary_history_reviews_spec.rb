# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Salary history review", type: :request do
  let(:company) { create(:company, plan_tier: "free", timezone: "Asia/Kolkata") }
  let(:admin) { create(:user, current_workspace: company) }
  let!(:admin_employment) { create(:employment, company:, user: admin, resigned_at: nil) }
  let(:employment) { create(:employment, company:, resigned_at: nil) }
  let(:salary) do
    { "salary_amount" => "1000.00", "salary_currency" => "INR", "salary_frequency" => "monthly", "salary_effective_on" => "2026-11-01" }
  end
  let!(:versions) do
    %w[2026-11-01 2026-11-10 2026-11-20].each_with_index.map do |date, index|
      employment.compensation_versions.create!(effective_on: date,
        salary_details: salary.merge("salary_amount" => "#{index + 1}000.00", "salary_effective_on" => date))
    end
  end
  let(:path) { "/employee-records/#{employment.id}/salary-history" }

  before do
    admin.add_role(:admin, company)
    employment.user.add_role(:employee, company)
    sign_in admin
  end

  def review(**changes)
    attributes = { company_id: company.id, active_ids: versions.map(&:id), decisions: versions.map do |version|
      { id: version.id, decision: version == versions[1] ? "retire" : "retain" }
    end }.merge(changes)
    patch path, params: { salary_review: attributes }
  end

  it "lets a free-workspace admin review historical employment without exposing bank data" do
    employment.update!(resigned_at: "2026-10-01")
    employment.discard!
    get path
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Review salary history", "1000.00", "Retain", "Mark as abandoned")
    expect(response.body).not_to include("bank_account")
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
  end

  it "retains all payloads and records the explicit abandoned-raise decision atomically" do
    query = "SELECT salary_details FROM compensation_versions WHERE employment_id = #{employment.id} ORDER BY id"
    raw = CompensationVersion.connection.select_values(query)
    expect { review }.to change { company.audits.where(action: "compensation_history_review").count }.by(1)
    expect(response).to have_http_status(:see_other)
    expect(versions.values_at(0, 2).map { |version| version.reload.reviewed_at }).to all(be_present)
    expect(versions[1].reload.superseded_at).to be_present
    expect(CompensationVersion.connection.select_values(query)).to eq(raw)
    expect(CompensationVersion.terms_for(employment.reload).map(&:last)).to eq(versions.values_at(0, 2).map(&:salary_details))
    travel_to(Time.utc(2026, 11, 11, 12)) do
      get "/api/v1/employee_records", params: { user_id: employment.user_id }
      expect(response.parsed_body.dig("employee_record", "current_salary", "salary_amount")).to eq("1000.00")
      expect(response.parsed_body.dig("employee_record", "compensation_history_requires_review")).to be(false)
    end
    audit = company.audits.where(action: "compensation_history_review").last
    expect(audit.user).to eq(admin)
    expect(audit.audited_changes.deep_stringify_keys).to include("employment_id" => employment.id,
      "retained_compensation_version_ids" => versions.values_at(0, 2).map(&:id),
      "superseded_compensation_version_ids" => [versions[1].id])
    expect(audit.audited_changes.to_json).not_to include("1000.00", "2000.00", "3000.00")
  end

  it "can explicitly retain the same intermediate salary when it was legitimate" do
    review(decisions: versions.map { |version| { id: version.id, decision: "retain" } })
    expect(response).to have_http_status(:see_other)
    expect(CompensationVersion.terms_for(employment.reload).map(&:last)).to eq(versions.map(&:salary_details))
    travel_to(Time.utc(2026, 11, 11, 12)) do
      get "/api/v1/employee_records", params: { user_id: employment.user_id }
      expect(response.parsed_body.dig("employee_record", "current_salary", "salary_amount")).to eq("2000.00")
    end
  end

  it "keeps already reviewed rows read-only" do
    reviewed = employment.compensation_versions.create!(effective_on: "2026-12-01", salary_details: salary, reviewed_at: 1.day.ago)
    stamp = reviewed.reviewed_at
    review(active_ids: versions.map(&:id) + [reviewed.id])
    expect(response).to have_http_status(:see_other)
    expect(reviewed.reload.reviewed_at).to eq(stamp)
    expect(reviewed.superseded_at).to be_nil
  end

  it "shows employees the review warning without allowing history access" do
    employment.user.update!(current_workspace: company)
    sign_in employment.user
    get "/api/v1/employee_records"
    result = response.parsed_body.fetch("employee_record")
    expect(result.fetch("compensation_history_requires_review")).to be(true)
    expect(result.fetch("current_salary").values).to all(be_nil)
    expect(result).not_to have_key("compensation_versions")
  end

  it "rejects stale active IDs without acknowledging any rows" do
    employment.compensation_versions.create!(effective_on: "2026-12-01", salary_details: salary)
    review
    expect(response).to have_http_status(:conflict)
    expect(versions.map { |version| version.reload.reviewed_at }).to all(be_nil)
  end

  it "rejects missing, duplicate, foreign and invalid decisions without changing history" do
    foreign = create(:employment, company:).compensation_versions.create!(effective_on: "2026-11-01", salary_details: salary)
    valid = versions.map { |version| { id: version.id, decision: "retain" } }
    [valid.first(2), valid + [valid.first], valid.first(2) + [{ id: foreign.id, decision: "retire" }],
      valid.first(2) + [{ id: versions.last.id, decision: "guess" }]].each do |decisions|
      review(decisions:)
      expect(response).to have_http_status(:unprocessable_content)
      expect(versions.map { |version| version.reload.reviewed_at }).to all(be_nil)
      expect(versions.map(&:superseded_at)).to all(be_nil)
    end
    review(active_ids: versions.map(&:id) + [versions.first.id])
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "rejects another workspace and a stale workspace identity" do
    review(company_id: create(:company).id)
    expect(response).to have_http_status(:conflict)
    other = create(:employment)
    get "/employee-records/#{other.id}/salary-history"
    expect(response).to have_http_status(:not_found)
  end

  it "does not allow an employee to inspect or review the admin salary-history payload" do
    employee = employment.user
    employee.update!(current_workspace: company)
    employee.add_role(:employee, company)
    sign_in employee
    get path, as: :json
    expect(response).to have_http_status(:forbidden)
    expect(response.body).not_to include("1000.00")
    review
    expect(response).to have_http_status(:found)
    expect(versions.map { |version| version.reload.reviewed_at }).to all(be_nil)
  end

  it "rolls back every decision when the audit cannot be written" do
    allow_any_instance_of(Company).to receive(:audits).and_raise("Synthetic audit failure")
    expect { review }.to raise_error("Synthetic audit failure")
    expect(versions.map { |version| version.reload.reviewed_at }).to all(be_nil)
    expect(versions.map(&:superseded_at)).to all(be_nil)
  end

  it "rechecks administrator access inside the employment lock" do
    allow_any_instance_of(EmployeeRecordPolicy).to receive(:manage?).and_return(true, false)
    review
    expect(response).to have_http_status(:found)
    expect(versions.map { |version| version.reload.reviewed_at }).to all(be_nil)
    expect(versions.map(&:superseded_at)).to all(be_nil)
  end
end
