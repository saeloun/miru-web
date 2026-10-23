# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payroll review reads", type: :request do
  include_context "persisted synthetic payroll review"

  let!(:revision) { workflow.revise!(actor: accounts, payload:, idempotency_key: "synthetic-api", expected_digest: nil) }

  before { sign_in owner }

  def fetch_run(parameters = {})
    get api_v1_payroll_run_path(run), params: parameters, as: :json
  end

  it "returns the latest immutable source, precise amounts and review audit to an owner" do
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    fetch_run
    expect(response).to have_http_status(200)
    data = json_response.fetch("payroll_run")
    expect(data.values_at("id", "company_id", "status")).to eq([run.id.to_s, company.id.to_s, "approved"])
    expect(data.dig("revision", "lines", 0, "amounts", "net_minor")).to eq("10250")
    expect(data.dig("revision", "lines", 0, "payee_name")).to eq(worker.full_name)
    expect(data.dig("revision", "approvals").pluck("stage")).to eq(%w[accounts final])
    expect(data.dig("revision", "audit", 0, "digest")).to eq(revision.digest)
    expect(response.headers["Cache-Control"]).to include("private", "no-store")
    expect(response.body).not_to include(owner.email, accounts.email, "quantity_source", "settlement_reference")
  end

  it "shows source changes as stale and invalidates the displayed approval state" do
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    work_entry.update!(duration: 240)
    fetch_run
    expect(json_response.dig("payroll_run", "status")).to eq("draft")
    expect(json_response.dig("payroll_run", "review_issues")).to include("invalid_snapshot")
  end

  it "allows only the assigned freshly eligible accounts reviewer" do
    sign_in accounts
    fetch_run
    expect(response).to have_http_status(200)
    accounts.remove_role(:book_keeper, company)
    fetch_run
    expect(response).to have_http_status(403)
    expect(response.body).not_to include("10250", worker.full_name, revision.digest)
  end

  %w[admin book_keeper].each do |role|
    it "hides salary rows from an unassigned #{role}" do
      reviewer = create(:user, current_workspace: company)
      create(:employment, company:, user: reviewer, resigned_at: nil)
      reviewer.add_role(role, company)
      sign_in reviewer
      get api_v1_payroll_runs_path, as: :json
      expect(json_response.fetch("payroll_runs")).to be_empty
      fetch_run
      expect(response).to have_http_status(403)
      expect(response.body).not_to include(worker.full_name, revision.digest, "10250")
    end
  end

  %w[employee manager client].each do |role|
    it "denies #{role} access to both index and salary detail" do
      accounts.remove_role(:book_keeper, company)
      accounts.add_role(role, company)
      sign_in accounts
      get api_v1_payroll_runs_path, as: :json
      expect(response).to have_http_status(403)
      fetch_run
      expect(response).to have_http_status(403)
      expect(response.body).not_to include("10250", worker.full_name)
    end
  end

  it "denies a resigned employment, discarded employment and discarded user" do
    job = owner.employments.find_by!(company:)
    job.update!(resigned_at: Date.yesterday)
    fetch_run
    expect(response).to have_http_status(403)
    job.update!(resigned_at: nil, discarded_at: Time.current)
    fetch_run
    expect(response).to have_http_status(403).or have_http_status(401)
    job.update!(discarded_at: nil)
    owner.update!(discarded_at: Time.current)
    fetch_run
    expect(response).to have_http_status(403).or have_http_status(401)
  end

  it "requires a current active employment rather than a future one" do
    owner.employments.find_by!(company:).update_columns(joined_at: Date.tomorrow)
    fetch_run
    expect(response).to have_http_status(403)
  end

  it "resolves company before run ID and rejects stale browser workspace context" do
    other_company = create(:company)
    owner.update!(current_workspace: other_company)
    create(:employment, company: other_company, user: owner, resigned_at: nil)
    owner.add_role(:owner, other_company)
    fetch_run
    expect(response).to have_http_status(403)
    expect(response.body).not_to include(worker.full_name, revision.digest, "10250")
    fetch_run(company_id: company.id)
    expect(response).to have_http_status(403)
    expect(response.headers["Cache-Control"]).to include("no-store")
  end

  it "rejects unauthenticated callers" do
    sign_out owner
    fetch_run
    expect(response).to have_http_status(401)
    expect(response.headers["Cache-Control"]).to include("no-store")
  end

  it "denies all payroll reads when the trusted enable is absent despite owner roles or forged parameters" do
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return(nil)
    [api_v1_payroll_runs_path, api_v1_payroll_run_path(run), preflight_api_v1_payroll_run_path(run)].each do |path|
      get path, params: { company_id: company.id, payroll_review_enabled: true, payroll_enabled: true }, as: :json
      expect(response).to have_http_status(403)
      expect(response.body).not_to include(worker.full_name, revision.digest, "10250")
      expect(response.headers["Cache-Control"]).to include("no-store")
    end
  end

  it "denies an enabled flag with another immutable company binding" do
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return((company.id + 1).to_s)
    fetch_run(company_id: company.id)
    expect(response).to have_http_status(403)
  end

  it "rejects forged expected-company parameters while retaining the entitled workspace" do
    fetch_run(company_id: company.id + 1)
    expect(response).to have_http_status(409)
    expect(response.body).not_to include(worker.full_name, revision.digest, "10250")
  end

  it "serializes an authoritative boolean in the actual current-company auth response" do
    get api_v1_users_me_path, as: :json
    expect(response).to have_http_status(200)
    expect(json_response.dig("company", "payroll_review_enabled")).to be(true)
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return(nil)
    get api_v1_users_me_path, as: :json
    expect(json_response.dig("company", "payroll_review_enabled")).to be(false)
  end

  it "never turns supplied client account or approval flags into a ready preflight" do
    get preflight_api_v1_payroll_run_path(run), params: {
      balance: "999999999", accounts_approved: true, final_approved: true, capabilities_verified: true,
      recipients_verified: true, company_id: company.id, total_minor: 1
    }, as: :json
    expect(response).to have_http_status(200)
    data = json_response.fetch("preflight")
    expect(data.values_at("status", "execution_enabled", "total_net_minor", "recipient_count"))
      .to eq(["blocked", false, "10250", 1])
    expect(data.fetch("blockers")).to include(*Payroll::ReviewSummary::SETUP_BLOCKERS, "approval_required")
    expect(data.dig("reconciliation", "reconciled")).to be(true)
    expect(WebMock).not_to have_requested(:any, /api\.mercury\.com|api\.razorpay\.com/)
  end

  it "remains preview only even for an approved revision" do
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    get preflight_api_v1_payroll_run_path(run), as: :json
    expect(json_response.dig("preflight", "approval_state")).to eq("approved")
    expect(json_response.dig("preflight", "status")).to eq("blocked")
    expect(json_response.dig("preflight", "blockers")).not_to include("approval_required")
  end

  it "paginates summaries without performing fresh payroll source checks" do
    expect(PayrollSources::MonthlyFacts).not_to receive(:current_snapshot?)
    get api_v1_payroll_runs_path, as: :json
    expect(response).to have_http_status(200)
    expect(json_response.fetch("payroll_runs").first.fetch("current_revision").fetch("digest")).to eq(revision.digest)
    expect(json_response.fetch("pagination")).to eq("page" => 1, "per_page" => 20, "has_more" => false)
    expect(response.body).not_to include("10250", worker.full_name)
  end

  def capture_revision_queries(&block)
    queries = []
    listener = lambda do |_name, _start, _finish, _id, data|
      queries << data[:sql] if data[:sql].match?(/\ASELECT .*FROM "payroll_revisions"/)
    end
    ActiveSupport::Notifications.subscribed(listener, "sql.active_record", &block)
    queries
  end

  it "loads twenty run heads in one metadata-only query without snapshot payloads" do
    19.times do |offset|
      another = PayrollRun.create!(company:, accounts_reviewer: accounts, final_reviewer: owner,
        period: Date.new(2024, 1, 1) + offset.months, currency: "INR")
      snapshot = payload.deep_dup
      snapshot["period"] = another.period.iso8601
      snapshot["lines"].first.merge!("source_snapshot" => nil, "calculation_snapshot" => nil, "source_resolutions" => [])
      Payroll::Workflow.new(another).revise!(actor: accounts, payload: snapshot, idempotency_key: "synthetic-index", expected_digest: nil)
    end
    queries = capture_revision_queries { get api_v1_payroll_runs_path, as: :json }
    expect(response).to have_http_status(200)
    expect(json_response.fetch("payroll_runs").size).to eq(20)
    expect(json_response.fetch("payroll_runs").all? { |item| item["current_revision"].present? }).to be(true)
    expect(queries.size).to eq(1)
    expect(queries.first).to include("DISTINCT ON (payroll_run_id)")
    expect(queries.first).not_to include("payroll_payload", '"payroll_revisions".*')
  end

  it "loads audit history as metadata while retaining the full current detail snapshot" do
    latest = workflow.revise!(actor: accounts, payload:, idempotency_key: "history-two", expected_digest: revision.digest)
    queries = capture_revision_queries { fetch_run }
    history = queries.select { |sql| sql.include?('"payroll_revisions"."created_by_id"') }
    expect(history.size).to eq(1)
    expect(history.first).not_to include("payroll_payload", '"payroll_revisions".*')
    expect(json_response.dig("payroll_run", "revision", "audit").pluck("number")).to eq([2, 1])
    expect(json_response.dig("payroll_run", "revision", "digest")).to eq(latest.digest)
    expect(json_response.dig("payroll_run", "revision", "lines", 0, "amounts", "net_minor")).to eq("10250")
    expect(json_response.dig("payroll_run", "revision", "lines", 0, "source", "digest"))
      .to eq(payload.dig("lines", 0, "source_snapshot", "digest"))
  end

  it "does not query when initializing the summary presenter" do
    queries = capture_revision_queries { Payroll::ReviewSummary.new(run) }
    expect(queries).to be_empty
  end

  it "caps list size and returns the next page for the same recipient scope" do
    21.times do |offset|
      PayrollRun.create!(company:, accounts_reviewer: accounts, final_reviewer: owner,
        period: Date.new(2024, 1, 1) + offset.months, currency: "INR")
    end
    get api_v1_payroll_runs_path, as: :json
    first = json_response.fetch("payroll_runs").pluck("id")
    expect(first.size).to eq(20)
    expect(json_response.dig("pagination", "has_more")).to be(true)
    get api_v1_payroll_runs_path, params: { page: 2 }, as: :json
    second = json_response.fetch("payroll_runs").pluck("id")
    expect(second.size).to eq(2)
    expect(first & second).to be_empty
    expect(json_response.dig("pagination", "has_more")).to be(false)
  end

  it "shows missing revisions with explicit blockers and no assumed zero balance or total" do
    another = PayrollRun.create!(company:, accounts_reviewer: accounts, final_reviewer: owner,
      period: Date.new(2026, 10, 1), currency: "INR")
    get preflight_api_v1_payroll_run_path(another), as: :json
    expect(json_response.dig("preflight", "total_net_minor")).to be_nil
    expect(json_response.dig("preflight", "blockers")).to include("revision_missing")
    expect(response.body).not_to include("available_balance")
  end

  def revise_large_population(duplicate: false)
    second = create(:employment, company:, user: duplicate ? worker : create(:user), resigned_at: nil)
    updated = payload.deep_dup
    line = updated["lines"].first
    line.merge!("source_snapshot" => nil, "source_resolutions" => [], "calculation_snapshot" => nil,
      "extras" => [], "reimbursements" => [], "deductions" => [],
      "amounts" => { "base_minor" => 9_000_000_000_000_000, "extras_minor" => 0,
                     "reimbursements_minor" => 0, "deductions_minor" => 0, "net_minor" => 9_000_000_000_000_000 })
    updated["lines"] << line.merge("employment_id" => second.id)
    workflow.revise!(actor: accounts, payload: updated, idempotency_key: "large-population", expected_digest: revision.digest)
  end

  it "keeps amounts and aggregate totals exact beyond Javascript integer precision" do
    latest = revise_large_population
    fetch_run
    expect(json_response.dig("payroll_run", "current_revision", "digest")).to eq(latest.digest)
    expect(json_response.dig("payroll_run", "revision", "lines", 0, "amounts", "net_minor")).to eq("9000000000000000")
    get preflight_api_v1_payroll_run_path(run), as: :json
    expect(json_response.dig("preflight", "total_net_minor")).to eq("18000000000000000")
  end

  it "blocks duplicate people represented by distinct employment records" do
    revise_large_population(duplicate: true)
    get preflight_api_v1_payroll_run_path(run), as: :json
    expect(json_response.dig("preflight", "reconciliation", "reconciled")).to be(false)
    expect(json_response.dig("preflight", "blockers")).to include("invalid_or_duplicate_recipient_records")
  end

  it "blocks incomplete records instead of silently treating a missing net as zero" do
    broken = payload.deep_dup
    broken["lines"][0]["amounts"].delete("net_minor")
    record = PayrollRevision.new(payroll_run: run, created_by: accounts, number: 2, parent_digest: revision.digest,
      digest: "a" * 64, idempotency_key: "corrupt-import", payroll_payload: broken)
    record.save!(validate: false)
    get preflight_api_v1_payroll_run_path(run), as: :json
    expect(json_response.dig("preflight", "total_net_minor")).to be_nil
    expect(json_response.dig("preflight", "blockers")).to include("missing_or_invalid_recipient_net", "invalid_snapshot")
  end

  it "rejects write routes instead of exposing dormant mutation actions" do
    post api_v1_payroll_runs_path, params: { payroll_payload: payload }, as: :json
    expect(response).to have_http_status(404)
    expect(PayrollRun.count).to eq(1)
  end
end
