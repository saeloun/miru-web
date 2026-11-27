# frozen_string_literal: true

require "rails_helper"
require "csv"

RSpec.describe "Legacy salary observation", type: :request do
  let(:company) { create(:company, plan_tier: "free", timezone: "Asia/Kolkata") }
  let(:owner) { create(:user, current_workspace: company) }
  let!(:owner_employment) { create(:employment, company:, user: owner, joined_at: "2026-01-01", resigned_at: nil) }
  let(:employment) { create(:employment, company:, joined_at: "2026-01-01", resigned_at: nil) }
  let(:salary) do
    { "salary_amount" => "1000.00", "salary_currency" => "INR", "salary_frequency" => "monthly", "salary_effective_on" => "2026-01-01" }
  end
  let!(:record) do
    employment.create_employee_record!(private_details: salary).tap { employment.compensation_versions.delete_all }
  end
  let!(:future) do
    employment.compensation_versions.create!(effective_on: "2026-12-01",
      salary_details: salary.merge("salary_amount" => "2000.00", "salary_effective_on" => "2026-12-01"))
  end
  let(:path) { salary_history_review_path(employment_id: employment.id) }

  around { |example| travel_to(Time.utc(2026, 11, 28, 12)) { example.run } }

  before do
    owner.add_role(:owner, company)
    employment.user.add_role(:employee, company)
    sign_in owner
  end

  def observe(**changes)
    post "#{path}/observe", params: { salary_observation: {
      company_id: company.id, active_ids: [future.id], payroll_version: record.payroll_version
    }.merge(changes) }
  end

  def retain(ids)
    patch path, params: { salary_review: { company_id: company.id, active_ids: ids,
      decisions: ids.map { |id| { id:, decision: "retain" } } } }
  end

  it "keeps reads inert and requires observation before retaining an incomplete legacy history" do
    original = record.private_details
    expect { get path }.not_to change { [CompensationVersion.count, company.audits.count] }
    expect(response.body).to include("1000.00", "2000.00", "Add stored salary for review")

    retain([future.id])

    expect(response).to have_http_status(:conflict)
    expect(future.reload.reviewed_at).to be_nil
    expect(record.reload.private_details).to eq(original)
  end

  it "lets an owner observe then explicitly retain old-path facts for current salary and CSV" do
    expect { observe }.to change(CompensationVersion, :count).by(1)
    expect(response).to have_http_status(:see_other)
    observed = employment.compensation_versions.order(:id).last
    expect(observed.salary_details).to eq(salary)
    expect(observed.effective_on).to eq(Date.new(2026, 1, 1))
    expect(observed.reviewed_at).to be_nil
    audit = company.audits.where(action: "compensation_history_observation").last
    expect(audit.user).to eq(owner)
    expect(audit.audited_changes.deep_stringify_keys).to include(
      "employment_id" => employment.id, "observed_compensation_version_id" => observed.id)
    expect(audit.audited_changes.to_json).not_to include("1000.00", "INR")

    expect { observe(active_ids: [future.id, observed.id]) }.not_to change(CompensationVersion, :count)
    expect(response).to have_http_status(:conflict)
    retain([future.id, observed.id])
    expect(response).to have_http_status(:see_other)
    get "/api/v1/employee_records", params: { user_id: employment.user_id }
    expect(response.parsed_body.dig("employee_record", "current_salary")).to eq(salary)
    report = company.employee_reports.create!(name: "Synthetic legacy salary", columns: %w[salary_amount salary_currency])
    get "/api/v1/employee_reports/#{report.id}/download", params: { month: "2026-11" }
    rows = CSV.parse(response.body, headers: true)
    expect(rows.pluck("Current salary amount")).to include("1000.00")
    expect(rows.pluck("Current salary amount")).not_to include("2000.00")
    expect(record.reload.private_details).to eq(salary)
  end

  it "rejects stale company, active history and stored salary identities without writing" do
    [{ company_id: create(:company).id }, { active_ids: [future.id + 1000] },
     { payroll_version: record.payroll_version + 1 }].each do |changes|
      expect { observe(**changes) }.not_to change(CompensationVersion, :count)
      expect(response).to have_http_status(:conflict)
    end
    expect(future.reload.reviewed_at).to be_nil
    expect(company.audits.where(action: "compensation_history_observation")).to be_empty
  end

  it "rolls back the observation when its audit fails" do
    allow_any_instance_of(Company).to receive(:audits).and_raise("Synthetic observation audit failure")
    expect { observe }.to raise_error("Synthetic observation audit failure")
    expect(employment.compensation_versions.reload.map(&:id)).to eq([future.id])
    expect(record.reload.private_details).to eq(salary)
  end

  it "rejects malformed observation envelopes without changing stored salary or history" do
    [[], { company_id: company.id, active_ids: [future.id, future.id], payroll_version: record.payroll_version },
     { company_id: company.id, active_ids: "guess", payroll_version: record.payroll_version },
     { company_id: company.id, active_ids: [future.id], payroll_version: record.payroll_version, salary_amount: "5000.00" }].each do |attributes|
      expect do
        post "#{path}/observe", params: { salary_observation: attributes }
      end.not_to change(CompensationVersion, :count)
      expect(response).to have_http_status(:unprocessable_content)
    end
    expect(record.reload.private_details).to eq(salary)
    expect(future.reload.reviewed_at).to be_nil
  end

  it "preserves historical staff access while rejecting a client-only salary target" do
    employment.update!(resigned_at: "2026-10-01")
    employment.discard!
    get path
    expect(response).to have_http_status(:ok)
    employment.user.remove_role(:employee, company)
    employment.user.add_role(:client, company)

    get path
    expect(response).to have_http_status(:found)
    expect(response.body).not_to include("1000.00")
    expect { observe }.not_to change(CompensationVersion, :count)
    expect(response).to have_http_status(:found)
    retain([future.id])
    expect(response).to have_http_status(:found)
    expect(future.reload.reviewed_at).to be_nil
  end

  it "rejects employee actors, foreign targets and access revoked inside the observation lock" do
    employment.user.update!(current_workspace: company)
    sign_in employment.user
    expect { observe }.not_to change(CompensationVersion, :count)
    expect(response).to have_http_status(:found)
    sign_in owner
    foreign = create(:employment)
    post "/employee-records/#{foreign.id}/salary-history/observe", params: { salary_observation: {
      company_id: company.id, active_ids: [future.id], payroll_version: record.payroll_version
    } }
    expect(response).to have_http_status(:not_found)
    allow_any_instance_of(Employment).to receive(:with_lock).and_wrap_original do |method, *arguments, &block|
      owner.remove_role(:owner, company)
      method.call(*arguments, &block)
    end
    expect { observe }.not_to change(CompensationVersion, :count)
    expect(response).to have_http_status(:found)
  end

  it "shows both application and missing declared dates before retaining an undated version" do
    record.update_columns(private_details: salary.except("salary_effective_on"))
    employment.compensation_versions.delete_all
    version = employment.compensation_versions.create!(effective_on: "2026-06-10",
      salary_details: salary.except("salary_effective_on"))
    get path
    row = Nokogiri::HTML(response.body).at_css("tbody tr")
    expect(row.text).to include("2026-06-10", "Date not recorded")
    expect(response.body).to include("Applies from", "Declared effective date", "financial costs unavailable")
    retain([version.id])
    expect(response).to have_http_status(:see_other)
    expect(record.reload.current_salary["salary_effective_on"]).to be_nil
  end

  it "denies an owner without a current or fallback workspace before resolving a salary target" do
    owner.update!(current_workspace: nil)
    owner_employment.discard!
    expect(User.find(owner.id).companies.with_kept_employments).to be_empty
    sign_in User.find(owner.id)

    get path

    expect(response).to have_http_status(:found)
    expect(response.body).not_to include("1000.00")
    expect { observe }.not_to change(CompensationVersion, :count)
    expect(response).to have_http_status(:found)
  end
end
