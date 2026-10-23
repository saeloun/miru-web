# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payroll review findings" do
  include_context "persisted synthetic payroll review"

  def persist_revision(actor: accounts, key: "review-regression", expected: nil)
    workflow.revise!(actor:, payload:, idempotency_key: key, expected_digest: expected)
  end

  def approve_revision(revision)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
  end

  def set_hourly_calculation(hours_source:, quantity_source: nil)
    line = payload["lines"].first
    snapshot = line.fetch("calculation_snapshot")
    input = snapshot.fetch("input").except("paid_quantity", "basis_quantity", "quantity_source")
    input["compensation"] = input.fetch("compensation").merge("basis" => "hourly", "amount" => "25")
    input.merge!("hours" => "4", "hours_source" => hours_source, "hours_reviewed" => true)
    input["quantity_source"] = quantity_source if quantity_source
    line["calculation_snapshot"] = PayrollCalculation::Calculator.new(policy: snapshot.fetch("policy"), input:).call.deep_dup
  end

  it "persists and approves a calculator net independently rounded with its recorded profile" do
    line = payload["lines"].first
    snapshot = line.fetch("calculation_snapshot")
    policy = snapshot.fetch("policy").deep_dup
    policy["rounding"]["net"]["digits"] = 0
    input = snapshot.fetch("input").deep_dup
    input["compensation"]["amount"] = "100.50"
    input["adjustments"] = []
    calculation = PayrollCalculation::Calculator.new(policy:, input:).call.deep_dup
    expect(calculation).to include("net" => "101.0", "review_ready" => true)
    line.merge!("calculation_snapshot" => calculation, "extras" => [], "reimbursements" => [], "deductions" => [],
      "amounts" => { "base_minor" => 10_050, "extras_minor" => 0, "reimbursements_minor" => 0,
                     "deductions_minor" => 0, "net_minor" => 10_100 })
    revision = persist_revision
    expect(revision.approval_issues).to be_empty
    approve_revision(revision)
    expect(workflow.status).to eq("approved")
  end

  it "accepts genuine hourly source evidence without an unused quantity source" do
    set_hourly_calculation(hours_source: payload.dig("lines", 0, "source_snapshot", "digest"))
    revision = persist_revision
    expect(revision.approval_issues).to be_empty
    approve_revision(revision)
    expect(workflow.status).to eq("approved")
  end

  it "preserves itemized adjustments and manual override deltas under independent net rounding" do
    line = payload["lines"].first
    snapshot = line.fetch("calculation_snapshot")
    policy = snapshot.fetch("policy").deep_dup
    policy["rounding"]["net"]["digits"] = 0
    input = snapshot.fetch("input").deep_dup
    input["adjustments"].zip(%w[0.75 0.25 0.50]).each { |entry, amount| entry["amount"] = amount }
    input["manual_net"] = { "amount" => "104", "currency" => "INR", "reason" => "synthetic_reviewed_override",
                            "reviewed" => true, "reviewed_by" => accounts.id.to_s }
    line["calculation_snapshot"] = PayrollCalculation::Calculator.new(policy:, input:).call.deep_dup
    line["extras"][0]["amount_minor"] = 75
    line["reimbursements"][0]["amount_minor"] = 25
    line["amounts"].merge!("extras_minor" => 75, "reimbursements_minor" => 25, "net_minor" => 10_100)
    revision = persist_revision
    expect(revision.approval_issues).to be_empty
    expect(revision.payroll_payload.dig("lines", 0, "calculation_snapshot", "manual_net_delta")).to eq("3.0")
    approve_revision(revision)
    expect(workflow.status).to eq("approved")
  end

  it "rejects a net amount outside the recorded rounding profile" do
    line = payload["lines"].first
    snapshot = line.fetch("calculation_snapshot")
    policy = snapshot.fetch("policy").deep_dup
    policy["rounding"]["net"]["digits"] = 0
    line["calculation_snapshot"] = PayrollCalculation::Calculator.new(policy:, input: snapshot.fetch("input")).call.deep_dup
    line["amounts"]["net_minor"] = 10_301
    expect { persist_revision }.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "keeps monthly provenance bound to the quantity source even with a matching hours source" do
    line = payload["lines"].first
    snapshot = line.fetch("calculation_snapshot")
    input = snapshot.fetch("input").merge("quantity_source" => "unrelated.synthetic.days",
      "hours_source" => line.dig("source_snapshot", "digest"))
    line["calculation_snapshot"] = PayrollCalculation::Calculator.new(policy: snapshot.fetch("policy"), input:).call.deep_dup
    revision = persist_revision
    expect(revision.approval_issues).to include("calculation_missing_or_inconsistent")
  end

  it "rejects unrelated hourly evidence even if the unused quantity source matches" do
    set_hourly_calculation(hours_source: "unrelated.synthetic.hours", quantity_source: payload.dig("lines", 0, "source_snapshot", "digest"))
    revision = persist_revision
    expect(revision.approval_issues).to include("calculation_missing_or_inconsistent")
    expect { workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest) }
      .to raise_error(ActiveRecord::RecordInvalid)
  end

  %w[admin book_keeper owner].each do |role|
    it "prevents an unassigned #{role} from replacing an approved head" do
      revision = persist_revision
      approve_revision(revision)
      actor = role == "owner" ? owner : create(:user, current_workspace: company)
      unless actor == owner
        create(:employment, company:, user: actor, resigned_at: nil)
        actor.add_role(role, company)
      end
      expect { persist_revision(actor:, key: "unassigned-author", expected: revision.digest) }
        .to raise_error(Payroll::Workflow::NotAuthorized)
      expect(run.current_revision.id).to eq(revision.id)
      expect(workflow.status).to eq("approved")
    end

    it "prevents direct revision creation by an unassigned #{role}" do
      actor = role == "owner" ? owner : create(:user, current_workspace: company)
      unless actor == owner
        create(:employment, company:, user: actor, resigned_at: nil)
        actor.add_role(role, company)
      end
      digest = PayrollRevision.chain_digest(Payroll::Snapshot.new(run, payload).digest, nil, 1)
      expect do
        run.payroll_revisions.create!(created_by: actor, payroll_payload: payload, number: 1, parent_digest: nil,
          idempotency_key: "direct-unassigned", digest:)
      end.to raise_error(ActiveRecord::RecordInvalid)
      expect(run.payroll_revisions.count).to eq(0)
    end
  end

  it "requires a fresh current workspace for direct creation by the assigned reviewer" do
    expect(run).to be_persisted
    User.where(id: accounts.id).update_all(current_workspace_id: create(:company).id)
    digest = PayrollRevision.chain_digest(Payroll::Snapshot.new(run, payload).digest, nil, 1)
    expect do
      run.payroll_revisions.create!(created_by: accounts, payroll_payload: payload, number: 1, parent_digest: nil,
        idempotency_key: "direct-stale-workspace", digest:)
    end.to raise_error(ActiveRecord::RecordInvalid)
  end

  it "requires a fresh role for direct creation by the assigned reviewer" do
    expect(run).to be_persisted
    expect(accounts.has_cached_role?(:book_keeper, company)).to be(true)
    accounts.remove_role(:book_keeper, company)
    digest = PayrollRevision.chain_digest(Payroll::Snapshot.new(run, payload).digest, nil, 1)
    expect do
      run.payroll_revisions.create!(created_by: accounts, payroll_payload: payload, number: 1, parent_digest: nil,
        idempotency_key: "direct-stale-role", digest:)
    end.to raise_error(ActiveRecord::RecordInvalid)
  end
end
