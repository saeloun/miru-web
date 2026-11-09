# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Retained billing line provenance" do
  include_context "reviewed mercury consultant payroll"

  it "compares legacy null and billing-only preparation without ignoring financial or source changes" do
    legacy = synthetic_payload.fetch("lines").sole.deep_dup
    legacy["preparation"] = nil
    current = legacy.deep_dup
    current["preparation"] = { "billing_identity" => Payroll::BillingIdentity.new(employment).binding }
    current.fetch("source_snapshot")["captured_at"] = 1.second.ago.iso8601(6)
    original = [legacy.deep_dup, current.deep_dup]

    expect(Payroll::MercuryRevisionGuard.same_line?(legacy, current)).to be(true)
    changed_money = current.deep_dup
    changed_money.fetch("amounts")["net_minor"] += 1
    expect(Payroll::MercuryRevisionGuard.same_line?(legacy, changed_money)).to be(false)
    changed_source = current.deep_dup
    changed_source.fetch("source_snapshot")["digest"] = "0" * 64
    expect(Payroll::MercuryRevisionGuard.same_line?(legacy, changed_source)).to be(false)
    expect([legacy, current]).to eq(original)
  end

  it "requires the actual bank-origin line rather than a money-equal head stripped of its sources" do
    instruction = accepted_instruction
    original = instruction.payroll_revision
    retained = original.payroll_payload.fetch("lines").sole.deep_dup
    captured_drift = retained.deep_dup
    captured_drift.fetch("source_snapshot")["captured_at"] = 1.second.ago.iso8601(6)
    expect(Payroll::MercuryRevisionGuard.new(run).protected_line?(captured_drift)).to be(true)

    payload = original.payroll_payload.deep_dup
    stripped = payload.fetch("lines").sole
    stripped["source_snapshot"] = nil
    stripped["calculation_snapshot"] = nil
    replacement = workflow.revise!(actor: accounts, payload:, idempotency_key: "stripped-sources", expected_digest: original.digest)
    expect(replacement).to be_persisted
    binding = Payroll::BillingIdentity.new(employment).binding
    Payroll::BillingIdentity.new(employment, actor: owner).review!(submission_id: binding.fetch("submission_id"), expected_review_id: binding.fetch("review_id"),
      decision: "needs_information", reason: "Review revoked after the changed revision", manual_tax_reviewed: false, missing_pan_acknowledged: false, idempotency_key: "revoke-after-strip")

    expect(Payroll::MercuryRevisionGuard.new(run).protected_line?(stripped)).to be(false)
    expect(Payroll::Snapshot.new(run, replacement.payroll_payload).approval_issues).to include("billing_identity_review_required")
    expect { workflow.approve!(actor: accounts, stage: "accounts", expected_digest: replacement.digest) }.to raise_error(ActiveRecord::RecordInvalid)
    expect(instruction.reload.submission_state).to eq("accepted")
    expect(instruction.payroll_revision_id).to eq(original.id)
  end
end
