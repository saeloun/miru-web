# frozen_string_literal: true

require "rails_helper"

RSpec.describe Payroll::Workflow do
  let(:company) { create(:company, base_currency: "INR") }
  let(:accounts) { create(:user) }
  let(:owner) { create(:user) }
  let(:worker) { create(:user) }
  let!(:employment) { create(:employment, company:, user: worker, resigned_at: nil) }
  let!(:work_entry) do
    project = create(:project, client: create(:client, company:))
    create(:timesheet_entry, user: worker, project:, work_date: Date.new(2026, 11, 2), duration: 480)
  end
  let(:run) do
    PayrollRun.create!(company:, period: Date.new(2026, 11, 1), currency: "INR",
      accounts_reviewer: accounts, final_reviewer: owner)
  end
  let(:workflow) { described_class.new(run) }
  let(:payload) do
    {
      "schema_version" => 1, "company_id" => company.id, "period" => "2026-11-01", "currency" => "INR",
      "policies" => Payroll::Snapshot::POLICIES.index_with do |kind|
        { "version" => "synthetic.#{kind}.v1", "effective_from" => "2026-11-01", "effective_to" => "2026-11-30" }
      end,
      "exceptions" => [], "lines" => [{
        "employment_id" => employment.id, "pay_type" => "employee", "currency" => "INR",
        "source_snapshot" => nil, "source_resolutions" => [], "calculation_snapshot" => nil,
        "amounts" => { "base_minor" => 10_000, "extras_minor" => 200, "reimbursements_minor" => 100,
                      "deductions_minor" => 50, "net_minor" => 10_250 },
        "extras" => [{ "code" => "synthetic_bonus", "amount_minor" => 200, "currency" => "INR" }],
        "reimbursements" => [{ "code" => "synthetic_expense", "amount_minor" => 100, "currency" => "INR" }],
        "deductions" => [{ "code" => "synthetic_adjustment", "amount_minor" => 50, "currency" => "INR" }]
      }]
    }
  end

  before do
    enable_synthetic_payroll(company.id)
    accounts.update!(current_workspace: company)
    owner.update!(current_workspace: company)
    create(:employment, company:, user: accounts, resigned_at: nil)
    create(:employment, company:, user: owner, resigned_at: nil)
    accounts.add_role(:book_keeper, company)
    owner.add_role(:owner, company)
    payload["lines"][0].values_at("extras", "reimbursements", "deductions").flatten.each do |entry|
      entry.merge!("origin_period" => "2026-11-01", "source_reference" => "synthetic.adjustment", "reason_code" => "reviewed")
    end
    source = PayrollSources::MonthlyFacts.new(company:, employment:, actor: accounts, month: "2026-11",
      policy_versions: { pay: "synthetic.pay.v1", attendance: "synthetic.proration.v1" }).call
    policy = JSON.parse(File.read(Rails.root.join("spec/fixtures/payroll/synthetic_cases.json"))).fetch("policy")
    policy["version"] = "synthetic.pay.v1"
    input = {
      "company_id" => company.id.to_s, "person_id" => worker.id.to_s, "period" => "2026-11", "engagement_type" => "employee",
      "source_currency" => "INR", "settlement_currency" => "INR",
      "compensation" => { "basis" => "monthly", "amount" => "100", "effective_from" => "2026-11-01", "effective_to" => "2026-11-30" },
      "paid_quantity" => "1", "basis_quantity" => "1", "quantity_source" => source["digest"],
      "adjustments" => [["synthetic_bonus", "bonus", "2"], ["synthetic_expense", "reimbursement", "1"],
                        ["synthetic_adjustment", "other_deduction", "0.5"]].map do |code, kind, amount|
        { "code" => code, "kind" => kind, "amount" => amount, "currency" => "INR", "origin_period" => "2026-11",
          "source" => "synthetic.adjustment", "reason" => "reviewed", "reviewed" => true }
      end
    }
    policy["rounding"].each_value { |profile| profile["digits"] = 2 }
    payload["lines"][0].merge!("source_snapshot" => source.deep_dup,
      "calculation_snapshot" => PayrollCalculation::Calculator.new(policy:, input:).call.deep_dup,
      "source_resolutions" => [{ "code" => "no_timeoff_entries", "decision" => "verified_zero_pto", "reason_code" => "synthetic_zero_leave",
                                "source_digest" => source["digest"], "actor_id" => accounts.id, "source_id" => nil }])
  end

  def revise(value = payload, key: "revision-one", expected: nil)
    workflow.revise!(actor: accounts, payload: value, idempotency_key: key, expected_digest: expected)
  end

  def approve_accounts(revision)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
  end

  def add_second_payee
    user = create(:user)
    job = create(:employment, user:, company:, resigned_at: nil)
    entry = create(:timesheet_entry, user:, project: work_entry.project, work_date: Date.new(2026, 11, 3), duration: 480)
    source = PayrollSources::MonthlyFacts.new(company:, employment: job, actor: accounts, month: "2026-11",
      policy_versions: { pay: "synthetic.pay.v1", attendance: "synthetic.proration.v1" }).call
    line = payload["lines"][0].deep_dup
    snapshot = line["calculation_snapshot"]
    input = snapshot["input"].merge("person_id" => user.id.to_s, "quantity_source" => source["digest"])
    line.merge!("employment_id" => job.id, "source_snapshot" => source.deep_dup,
      "calculation_snapshot" => PayrollCalculation::Calculator.new(policy: snapshot["policy"], input:).call.deep_dup)
    line["source_resolutions"][0]["source_digest"] = source["digest"]
    payload["lines"] << line
    entry
  end

  it "requires accounts review before the distinct assigned owner can approve an exact revision" do
    revision = revise
    expect { workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest) }
      .to raise_error(ActiveRecord::RecordInvalid)
    approve_accounts(revision)
    expect(workflow.status).to eq("accounts_approved")
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    expect(workflow.status).to eq("approved")
  end

  it "invalidates downstream approvals after a material revision and preserves prior history" do
    first = revise
    approve_accounts(first)
    workflow.approve!(actor: owner, stage: "final", expected_digest: first.digest)
    changed = payload.deep_dup
    changed["exceptions"] = ["recheck_source"]
    second = revise(changed, key: "revision-two", expected: first.digest)
    expect(workflow.status).to eq("draft")
    expect(first.payroll_approvals.count).to eq(2)
    expect(second.payroll_approvals.count).to eq(0)
    expect { workflow.approve!(actor: owner, stage: "final", expected_digest: first.digest) }
      .to raise_error(described_class::Conflict)
  end

  it "replays identical requests with canonical key order but rejects reused keys for changed payloads" do
    first = revise
    expect(revise(payload.to_a.reverse.to_h).id).to eq(first.id)
    changed = payload.deep_dup
    changed["exceptions"] = ["needs_review"]
    expect { revise(changed) }.to raise_error(described_class::Conflict)
    expect(PayrollRevision.count).to eq(1)
  end

  it "rejects stale edits and stale idempotent replays" do
    first = revise
    revise(payload, key: "revision-two", expected: first.digest)
    expect { revise(payload, key: "revision-three", expected: first.digest) }.to raise_error(described_class::Conflict)
    expect { revise }.to raise_error(described_class::Conflict)
  end

  it "gives restored content a different revision digest" do
    first = revise
    second = revise(payload, key: "revision-two", expected: first.digest)
    expect(second.digest).not_to eq(first.digest)
  end

  it "blocks approvals with missing, out-of-period policies or unresolved workbook exceptions" do
    payload["policies"].delete("mapping")
    payload["policies"]["pay"]["effective_to"] = "2026-11-15"
    payload["exceptions"] = ["unverified_proration"]
    revision = revise
    expect(revision.approval_issues).to include("missing_or_ineffective_mapping_policy",
      "missing_or_ineffective_pay_policy", "unverified_proration")
    expect { approve_accounts(revision) }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "rejects cross-company source records" do
    payload["lines"][0]["employment_id"] = create(:employment).id
    expect { revise }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "rejects discarded source records" do
    employment.discard!
    expect { revise }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "rejects duplicate source lines" do
    payload["lines"] << payload["lines"][0].deep_dup
    expect { revise }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "rejects company and currency substitution" do
    payload["company_id"] = company.id + 100
    expect { revise }.to raise_error(ActiveRecord::RecordInvalid)
    payload["company_id"] = company.id
    payload["lines"][0]["extras"][0]["currency"] = "USD"
    expect { revise }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "rejects floating point amounts and unreconciled adjustments" do
    payload["lines"][0]["amounts"]["base_minor"] = 10_000.0
    expect { revise }.to raise_error(ActiveRecord::RecordInvalid)
    payload["lines"][0]["amounts"]["base_minor"] = 10_000
    payload["lines"][0]["extras"][0]["amount_minor"] = 201
    expect { revise }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "rejects unknown payload fields and malformed policy dates" do
    payload["bank_account"] = "forbidden"
    expect { revise }.to raise_error(ActiveRecord::RecordInvalid)
    payload.delete("bank_account")
    payload["policies"]["pay"]["effective_from"] = "invalid"
    expect { revise }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "supports consultant snapshots without interpreting pay or tax rules" do
    payload["lines"][0]["pay_type"] = "consultant"
    snapshot = payload["lines"][0]["calculation_snapshot"]
    input = snapshot["input"].merge("engagement_type" => "consultant")
    payload["lines"][0]["calculation_snapshot"] = PayrollCalculation::Calculator.new(policy: snapshot["policy"], input:).call.deep_dup
    expect(revise.payroll_payload["lines"][0]["pay_type"]).to eq("consultant")
  end

  it "rechecks live membership and roles instead of retaining cached authorization" do
    revision = revise
    approve_accounts(revision)
    accounts.remove_role(:book_keeper, company)
    expect(workflow.status).to eq("draft")
    expect { workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest) }
      .to raise_error(ActiveRecord::RecordInvalid)
    expect { revise(payload, key: "revision-two", expected: revision.digest) }.to raise_error(described_class::NotAuthorized)
  end

  it "rejects an unassigned reviewer even with an accounts role" do
    revision = revise
    worker.add_role(:admin, company)
    expect { workflow.approve!(actor: worker, stage: "accounts", expected_digest: revision.digest) }
      .to raise_error(ActiveRecord::RecordInvalid)
  end

  it "rejects a discarded reviewer membership" do
    revision = revise
    Employment.find_by!(company:, user: accounts).discard!
    expect { approve_accounts(revision) }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "rejects role grants scoped to another company" do
    accounts.remove_role(:book_keeper, company)
    accounts.add_role(:book_keeper, create(:company))
    expect { run }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "requires month-start periods and distinct reviewers" do
    expect(run).to be_persisted
    duplicate = PayrollRun.new(company:, period: Date.new(2026, 12, 2), currency: "INR",
      accounts_reviewer: owner, final_reviewer: owner)
    expect(duplicate).not_to be_valid
    expect(duplicate.errors.attribute_names).to include(:period, :final_reviewer)
  end

  it "prevents record mutation and deletion through model and direct SQL paths" do
    revision = revise
    approval = approve_accounts(revision)
    [run, revision, approval].each do |record|
      expect { record.update!(updated_at: Time.current) }.to raise_error(ActiveRecord::ReadOnlyRecord)
      error = record == approval ? ActiveRecord::ReadOnlyRecord : ActiveRecord::DeleteRestrictionError
      expect { record.destroy! }.to raise_error(error)
      expect { record.class.transaction(requires_new: true) { record.class.where(id: record.id).update_all(updated_at: Time.current) } }
        .to raise_error(ActiveRecord::StatementInvalid, /immutable/)
      expect { record.class.transaction(requires_new: true) { record.class.where(id: record.id).delete_all } }
        .to raise_error(ActiveRecord::StatementInvalid, /immutable/)
    end
  end

  it "restricts company removal while historical review records exist" do
    revise
    expect { Company.where(id: company.id).delete_all }.to raise_error(ActiveRecord::InvalidForeignKey)
  end

  it "filters snapshot attributes from model inspection" do
    revision = revise
    expect(revision.inspect).not_to include("synthetic_bonus")
  end

  it "rejects malformed internal payloads with validation errors" do
    [nil, 42, { "schema_version" => 1, invalid: true }].each do |value|
      expect { revise(value) }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  it "rechecks discarded users and current workspace from persisted state" do
    revision = revise
    User.where(id: accounts.id).update_all(discarded_at: Time.current)
    expect { approve_accounts(revision) }.to raise_error(ActiveRecord::RecordInvalid)
    User.where(id: accounts.id).update_all(discarded_at: nil, current_workspace_id: create(:company).id)
    expect { approve_accounts(revision) }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "rejects non-dry runs at the model and database boundary" do
    expect(run.dry_run).to be(true)
    candidate = PayrollRun.new(company:, period: Date.new(2026, 12, 1), currency: "INR", dry_run: false,
      accounts_reviewer: accounts, final_reviewer: owner)
    expect(candidate).not_to be_valid
    expect { candidate.save!(validate: false) }.to raise_error(ActiveRecord::StatementInvalid, /payroll_run_dry_run_only/)
  end

  it "does not emit payroll payloads to the domain event stream" do
    assert_no_event_reported { revise }
  end

  it "invalidates existing approvals when an original Miru time entry changes" do
    revision = revise
    approve_accounts(revision)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    work_entry.update!(duration: 400)
    expect(workflow.status).to eq("draft")
    expect(revision.approval_issues).to include("invalid_snapshot")
    expect(revision.payroll_approvals.count).to eq(2)
  end

  it "keeps existing approval valid when a reviewer opens another workspace" do
    revision = revise
    approve_accounts(revision)
    accounts.update!(current_workspace: create(:company))
    expect(workflow.status).to eq("accounts_approved")
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    expect(workflow.status).to eq("approved")
  end

  it "blocks missing calculator and source snapshots" do
    payload["lines"][0]["calculation_snapshot"] = nil
    revision = revise
    expect(revision.approval_issues).to include("calculation_missing_or_inconsistent")
    expect { approve_accounts(revision) }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "rejects calculator snapshot tampering" do
    payload["lines"][0]["calculation_snapshot"]["net"] = "999"
    expect { revise }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "rejects extra private fields in source snapshots" do
    payload["lines"][0]["source_snapshot"]["bank_account"] = "forbidden"
    expect { revise }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "blocks a replayable calculation bound to the wrong person" do
    snapshot = payload["lines"][0]["calculation_snapshot"]
    input = snapshot["input"].merge("person_id" => accounts.id.to_s)
    payload["lines"][0]["calculation_snapshot"] = PayrollCalculation::Calculator.new(policy: snapshot["policy"], input:).call.deep_dup
    revision = revise
    expect(revision.approval_issues).to include("calculation_missing_or_inconsistent")
  end

  it "requires explicit accounts evidence for verified zero PTO" do
    payload["lines"][0]["source_resolutions"] = []
    revision = revise
    expect(revision.approval_issues).to include("source_exception:no_timeoff_entries")
    expect { approve_accounts(revision) }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "rejects a source resolution attributed to a different actor" do
    payload["lines"][0]["source_resolutions"][0]["actor_id"] = owner.id
    revision = revise
    expect(revision.approval_issues).to include("source_exception:no_timeoff_entries")
  end

  it "does not allow arbitrary resolution of hard blocking source exceptions" do
    work_entry.discard!
    source = PayrollSources::MonthlyFacts.new(company:, employment:, actor: accounts, month: "2026-11",
      policy_versions: { pay: "synthetic.pay.v1", attendance: "synthetic.proration.v1" }).call
    line = payload["lines"][0]
    line["source_snapshot"] = source.deep_dup
    snapshot = line["calculation_snapshot"]
    input = snapshot["input"].merge("quantity_source" => source["digest"])
    line["calculation_snapshot"] = PayrollCalculation::Calculator.new(policy: snapshot["policy"], input:).call.deep_dup
    line["source_resolutions"] << { "code" => "no_work_entries", "decision" => "reviewed_override", "reason_code" => "manual_claim",
                                    "source_digest" => source["digest"], "actor_id" => accounts.id, "source_id" => nil }
    expect(revise.approval_issues).to include("source_exception:no_work_entries")
  end

  it "compares every adjustment provenance against the stored calculator input" do
    payload["lines"][0]["reimbursements"][0]["origin_period"] = "2026-10-01"
    expect(revise.approval_issues).to include("calculation_missing_or_inconsistent")
  end

  it "rechecks every payee source and bounds query growth for the internal dry run" do
    second_entry = add_second_payee
    revision = revise
    approve_accounts(revision)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    queries = []
    callback = ->(_name, _start, _finish, _id, data) { queries << data[:sql] unless data[:name] == "SCHEMA" }
    ActiveSupport::Notifications.subscribed(callback, "sql.active_record") do
      expect(workflow.status).to eq("approved")
    end
    expect(queries.size).to be <= 100
    RSpec.configuration.reporter.message("Payroll status source verification: #{queries.size} queries for 2 payees")
    second_entry.update!(duration: 450)
    expect(workflow.status).to eq("draft")
    expect(revision.approval_issues).to include("invalid_snapshot")
  end

  it "limits the first internal batch size and malformed JSON depth" do
    payload["lines"] *= Payroll::Snapshot::MAX_LINES + 1
    expect { revise }.to raise_error(ActiveRecord::RecordInvalid)
    deep = "leaf"
    25.times { deep = { "child" => deep } }
    expect { revise(deep) }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "redacts the plain snapshot service inspection" do
    snapshot = Payroll::Snapshot.new(run, payload)
    expect(snapshot.inspect).to include("[FILTERED]")
    expect(snapshot.inspect).not_to include("synthetic_bonus")
  end
end
