# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant billing identity payment binding" do
  include_context "reviewed mercury consultant payroll"
  let(:billing_identity_ready) { false }

  it "requires reviewed billing identity before approving a new consultant payment" do
    expect(Payroll::Snapshot.new(run, synthetic_payload).approval_issues).to include("billing_identity_review_required")
    expect { approve_revision }.to raise_error(ActiveRecord::RecordInvalid, /source references/i)
  end

  context "with reviewed identity" do
    let(:billing_identity_ready) { true }

    def revoke_identity
      binding = Payroll::BillingIdentity.new(employment).binding
      Payroll::BillingIdentity.new(employment, actor: owner).review!(submission_id: binding.fetch("submission_id"),
        expected_review_id: binding.fetch("review_id"), decision: "needs_information", reason: "Synthetic correction required",
        manual_tax_reviewed: false, missing_pan_acknowledged: false, idempotency_key: "revoke-billing")
    end

    it "binds the review without changing v2 monetary sources or exposing private facts" do
      before = synthetic_payload.fetch("lines").sole
      binding = Payroll::BillingIdentity.new(employment).binding
      expect(before.dig("preparation", "billing_identity")).to eq(binding)
      expect(binding.keys).to match_array(%w[version submission_id review_id digest])
      expect(binding.to_json).not_to include("AAAPC1234D", "Synthetic Consultant", "411001")
      expect(before.dig("source_snapshot", "source_version")).to eq("miru-monthly-facts-v2")
      revoke_identity
      after = synthetic_payload.fetch("lines").sole
      expect(after.fetch("source_snapshot").except("captured_at")).to eq(before.fetch("source_snapshot").except("captured_at"))
      expect(after.fetch("amounts")).to eq(before.fetch("amounts"))
      expect(Payroll::Snapshot.new(run, synthetic_payload).approval_issues).to include("billing_identity_review_required")
    end

    it "rejects forged and malformed bindings even when all monetary inputs are unchanged" do
      payload = synthetic_payload
      payload.fetch("lines").sole.fetch("preparation").fetch("billing_identity")["review_id"] = "9223372036854775807"
      expect { approve_revision(payload:) }.to raise_error(ActiveRecord::RecordInvalid)
      payload.fetch("lines").sole.fetch("preparation").fetch("billing_identity")["review_id"] = "1e3"
      expect { approve_revision(payload:, key: "malformed-binding") }.to raise_error(ActiveRecord::RecordInvalid)
      expect(run.payroll_revisions).to be_empty
    end

    it "blocks an already prepared Mercury instruction after approval is withdrawn without reaching the provider" do
      instruction = prepared_instruction
      revoke_identity
      write = stub_mercury_write
      expect do
        Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
      end.to raise_error(Payroll::MercuryPayment::Blocked) { |error| expect(error.codes).to include("billing_identity_review_required") }
      expect(write).not_to have_been_requested
      expect(instruction.reload.submission_state).to eq("prepared")
    end

    it "blocks a queued India handoff after approval is withdrawn without changing its frozen report" do
      ConsultantCompensation.create!(employment:, created_by: owner, effective_on: "2026-11-01", monthly_fee: 62_500,
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: legal_name, change_reason: "Synthetic India funding")
      record_synthetic_pto_treatment
      revision = approve_revision
      service = Payroll::IndiaHandoff.new(run)
      handoff = service.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
        accounts_email: "accounts@example.test", bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
      report = handoff.report.deep_dup
      revoke_identity
      expect(service.dispatch_blocker(handoff)).to eq("run_not_approved")
      expect(service.preview(employment_id: employment.id).fetch(:blockers)).to include("billing_identity_review_required")
      expect(handoff.reload.report).to eq(report)
      expect(handoff.payroll_india_deliveries.sole.state).to eq("queued")
    end
  end
end
