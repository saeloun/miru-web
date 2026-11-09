# frozen_string_literal: true

require "rails_helper"

RSpec.describe Payroll::ConsultantRevision do
  include_context "approved mercury consultant payroll"

  let(:cutoff) { Date.current.iso8601 }
  let(:builder) { described_class.new(run, actor: accounts) }
  let!(:claim) do
    create(:expense, company:, user: worker, amount: 5_000, currency: "INR", date: Date.new(2026, 11, 2), status: :approved, approved_at: 1.minute.ago)
  end

  before do
    employment.update!(joined_at: Date.new(2020, 1, 1))
    company.update!(timezone: "Asia/Kolkata") if company.timezone.blank?
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment
  end

  around do |example|
    travel_to(Time.utc(2026, 12, 5, 12)) { example.run }
  end

  def build(unpaid: nil, reason: nil, expenses: [], **extra)
    if unpaid.is_a?(String) && unpaid.match?(/\A\d+(?:\.\d{1,2})?\z/) && unpaid.to_d.positive? && reason.present?
      record_synthetic_pto_treatment(unpaid_hours: unpaid)
    end
    builder.create!(
      consultants: [{ employment_id: employment.id, confirmed_unpaid_hours: unpaid, unpaid_reason: reason, expense_ids: expenses, acknowledged: true }.merge(extra)],
      cutoff:, expected_digest: run.current_revision&.digest, idempotency_key: SecureRandom.uuid
    )
  end

  def approve(revision)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
  end

  def line(revision)
    revision.payroll_payload["lines"].first
  end

  def expected_full_month_hours
    (Date.new(2026, 11, 1)..Date.new(2026, 11, 30)).count { |date| (1..5).cover?(date.cwday) } * 8
  end

  it "builds a revision the existing snapshot validation approves" do
    revision = build
    expect(revision.approval_issues).to eq([])
    approve(revision)
    expect(workflow.status).to eq("approved")
    expect(line(revision)["pay_type"]).to eq("consultant")
    expect(line(revision).dig("amounts", "net_minor")).to eq(6_250_000)
  end

  it "prorates the fee for confirmed unpaid hours but never the reimbursement" do
    unpaid = (expected_full_month_hours * 0.375).to_s
    revision = build(unpaid:, reason: "Approved unpaid leave", expenses: [claim.id])
    amounts = line(revision)["amounts"]
    expect(amounts["base_minor"]).to eq(3_906_250)
    expect(amounts["reimbursements_minor"]).to eq(500_000)
    expect(amounts["net_minor"]).to eq(4_406_250)
    expect(line(revision)["reimbursements"].first["source_reference"]).to eq(Payroll::ClaimReference.for(claim))
  end

  it "records withholding and deductions separately from fee" do
    revision = build(withholding: "1000.00", other_deduction: "500.00", other_earning: "250.00")
    amounts = line(revision)["amounts"]
    expect(amounts.values_at("base_minor", "extras_minor", "deductions_minor", "net_minor")).to eq([6_250_000, 25_000, 150_000, 6_125_000])
    expect(line(revision)["deductions"].pluck("code")).to contain_exactly("withholding", "other_deduction")
    expect(revision.approval_issues).to eq([])
  end

  it "requires an explicit acknowledgement of warnings and exceptions" do
    expect do
      builder.create!(consultants: [{ employment_id: employment.id, expense_ids: [], acknowledged: false }], cutoff:, expected_digest: nil, idempotency_key: "x")
    end.to raise_error(Payroll::MercuryPayment::Blocked) { |error| expect(error.codes).to eq(["acknowledgement_required"]) }
  end

  it "records the acknowledging actor against each resolved warning" do
    resolutions = line(build)["source_resolutions"]
    expect(resolutions.pluck("actor_id").uniq).to eq([accounts.id])
    expect(resolutions.pluck("code")).to include("no_timeoff_entries", "work_requires_review")
  end

  it "keeps explicitly deferred missing time out of unpaid deductions" do
    expect(line(build).dig("amounts", "net_minor")).to eq(6_250_000)
  end

  it "rejects claims that are pending, rejected, paid, foreign or another person's" do
    other = create(:employment, company:, resigned_at: nil)
    candidates = [
      create(:expense, company:, user: worker, amount: 10, currency: "INR", date: Date.new(2026, 11, 2), status: :submitted),
      create(:expense, company:, user: worker, amount: 10, currency: "INR", date: Date.new(2026, 11, 2), status: :rejected),
      create(:expense, company:, user: worker, amount: 10, currency: "INR", date: Date.new(2026, 11, 2), status: :paid, paid_at: Time.current),
      create(:expense, company:, user: worker, amount: 10, currency: "USD", date: Date.new(2026, 11, 2), status: :approved),
      create(:expense, company:, user: other.user, amount: 10, currency: "INR", date: Date.new(2026, 11, 2), status: :approved)
    ]
    candidates.each do |expense|
      expect { build(expenses: [expense.id]) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    end
  end

  it "keeps a not-ready consultant from blocking another" do
    missing = create(:employment, company:, user: create(:user), resigned_at: nil, joined_at: Date.new(2020, 1, 1))
    ConsultantCompensation.create!(employment: missing, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 1000,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: legal_name, change_reason: "Synthetic")
    summary = builder.preparation(cutoff:)
    not_ready = summary.find { |row| row[:employment_id] == missing.id }
    ready = summary.find { |row| row[:employment_id] == employment.id }
    expect(not_ready[:ready]).to be(false)
    expect(not_ready[:not_ready_reasons]).to include("no_work_entries")
    expect(ready[:ready]).to be(true)
    expect { build }.not_to raise_error
  end

  it "only lets the assigned accounts reviewer prepare" do
    other = described_class.new(run, actor: owner)
    expect do
      other.create!(consultants: [{ employment_id: employment.id, acknowledged: true }], cutoff:, expected_digest: nil, idempotency_key: "y")
    end.to raise_error(Payroll::Workflow::NotAuthorized)
  end

  it "retains the unpaid reason and cutoff in the approved line" do
    revision = build(unpaid: "8", reason: "Approved unpaid leave")
    expect(line(revision)["preparation"]).to include("cutoff" => cutoff, "confirmed_unpaid_hours" => "8.0", "unpaid_reason" => "Approved unpaid leave")
    expect(line(revision)["preparation"]["terms_id"]).to be_present
    expect(revision.approval_issues).to eq([])
  end

  it "prefills preparation from the current revision and marks consultants with bank activity" do
    revision = build(unpaid: "8", reason: "Approved unpaid leave", expenses: [claim.id], withholding: "100.00")
    row = builder.preparation(cutoff:).find { |entry| entry[:employment_id] == employment.id }
    expect(row[:current]).to eq(included: true, confirmed_unpaid_hours: "8.0", unpaid_reason: "Approved unpaid leave", expense_ids: [claim.id],
      other_earning: nil, other_deduction: nil, withholding: "100.0")
    expect(row[:locked]).to be(false)
    expect(revision.approval_issues).to eq([])
  end

  it "still rejects malformed payloads with validation errors when no bank activity exists" do
    expect do
      workflow.revise!(actor: accounts, payload: nil, idempotency_key: "bad", expected_digest: nil)
    end.to raise_error(ActiveRecord::RecordInvalid)
  end

  describe "reservation" do
    it "reserves selected claims only at final approval" do
      revision = build(expenses: [claim.id])
      expect(claim.reload.payroll_reserved?).to be(false)
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      expect(claim.reload.payroll_reserved?).to be(false)
      workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
      expect(claim.reload.payroll_reserved?).to be(true)
      expect(claim.status).to eq("approved")
      expect(workflow.status).to eq("approved")
    end

    it "blocks direct settlement, review changes, edits and deletion of a reserved claim" do
      approve(build(expenses: [claim.id]))
      expect { claim.reload.mark_paid! }.to raise_error(ActiveRecord::RecordInvalid, /reserved/)
      expect { claim.reload.update!(amount: 1) }.to raise_error(ActiveRecord::RecordInvalid, /reserved/)
      expect { claim.reload.reject! }.to raise_error(ActiveRecord::RecordInvalid, /reserved/)
      policy = ExpensePolicy.new(owner, claim.reload)
      expect([policy.mark_paid?, policy.update?, policy.destroy?, policy.approve?]).to all(be(false))
    end

    it "freezes approved claim amounts and requires reapproval after material claim changes" do
      original = build(expenses: [claim.id])
      approve(original)
      snapshot = original.payroll_payload.deep_dup
      reservation = PayrollExpenseReservation.active.find_by!(expense: claim)
      expect { original.update!(payroll_payload: {}) }.to raise_error(ActiveRecord::ReadOnlyRecord)
      expect { claim.reload.update!(amount: 6_000) }.to raise_error(ActiveRecord::RecordInvalid, /reserved/)
      expect(claim.reload.amount).to eq(5_000)

      build
      expect(reservation.reload.released_at).to be_present
      claim.reload.update!(amount: 6_000)
      expect(claim).to be_submitted
      expect { build(expenses: [claim.id]) }.to raise_error(Payroll::ConsultantReview::InvalidInput, /no longer eligible/)
      claim.approve!
      revised = build(expenses: [claim.id])

      expect(original.reload.payroll_payload).to eq(snapshot)
      expect(reservation.reload.amount_minor).to eq(500_000)
      expect(line(revised).dig("amounts", "reimbursements_minor")).to eq(600_000)
      expect(workflow.status).to eq("draft")
      expect { workflow.approve!(actor: owner, stage: "final", expected_digest: original.digest) }.to raise_error(Payroll::Workflow::Conflict)
      expect do
        workflow.approve!(actor: owner, stage: "final", expected_digest: revised.digest)
      end.to raise_error(ActiveRecord::RecordInvalid, /requires a current eligible accounts approval/)
      expect(revised.payroll_approvals).to be_empty

      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revised.digest)
      expect(workflow.status).to eq("accounts_approved")
      workflow.approve!(actor: owner, stage: "final", expected_digest: revised.digest)
      expect(workflow.status).to eq("approved")
      expect(PayrollExpenseReservation.active.where(expense: claim).sole).to have_attributes(payroll_revision_id: revised.id, amount_minor: 600_000)
    end

    it "keeps a reserved claim out of another run" do
      approve(build(expenses: [claim.id]))
      later = PayrollRun.create!(company:, period: Date.new(2026, 12, 1), currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
      review = Payroll::ConsultantReview.new(employment:, month: later.period, cutoff: Date.current, inputs: { own_run_id: later.id }).process
      expect(review[:eligible_expenses]).to be_empty
      expect(review[:excluded_expenses]["reserved_by_payroll"]).to eq(1)
    end

    it "does not reserve the same claim from two runs" do
      revision = build(expenses: [claim.id])
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      later = PayrollRun.create!(company:, period: Date.new(2026, 12, 1), currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
      PayrollExpenseReservation.create!(company_id: company.id, expense: claim, payroll_run: later, payroll_revision: revision, employment:, amount_minor: 500_000)
      expect do
        workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
      end.to raise_error(ActiveRecord::RecordInvalid, /unresolved review issues/)
      expect(revision.payroll_approvals.where(stage: "final")).to be_empty
      expect(PayrollExpenseReservation.where(expense: claim, payroll_run: run)).to be_empty
    end

    it "turns a lost reservation race into a conflict and keeps no approval" do
      revision = build(expenses: [claim.id])
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      allow(PayrollExpenseReservation).to receive(:create!).and_raise(ActiveRecord::RecordNotUnique)
      expect do
        workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
      end.to raise_error(Payroll::Workflow::Conflict)
      expect(revision.payroll_approvals.where(stage: "final")).to be_empty
    end

    it "invalidates approval when the claim changes before reservation" do
      revision = build(expenses: [claim.id])
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      claim.reload.update!(amount: 4_000)
      expect(revision.approval_issues).to include("claim_changed:#{claim.id}")
      expect(workflow.status).to eq("draft")
    end

    it "releases a reservation when a new revision replaces a consultant with nothing in flight" do
      revision = build(expenses: [claim.id])
      approve(revision)
      build
      expect(claim.reload.payroll_reserved?).to be(false)
      expect(PayrollExpenseReservation.where(expense: claim).pick(:released_at)).to be_present
    end

    it "settles through the expense on full credit and only once" do
      revision = build(expenses: [claim.id])
      approve(revision)
      verified_connection
      linked_recipient
      leg = Payroll::MercuryPayment.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:).first
      stub_mercury_reads
      stub_mercury_write(mercury_json(mercury_request("amount" => (leg.principal_minor / 100.0))))
      Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: leg.id, expected_digest: leg.frozen_digest)
      PayrollPaymentInstruction.find(leg.id).update!(request_status: "approved", transaction_status: "sent", transaction_link_state: "linked")
      service = Payroll::MercuryReconciliation.new(run)
      service.record_credit!(actor: accounts, instruction_id: leg.id, amount: "1000.00", credited_on: company.resolved_time_zone.today.iso8601, reference: "UTR1")
      expect(claim.reload).not_to be_paid
      service.record_credit!(actor: accounts, instruction_id: leg.id, amount: "66500.00", credited_on: company.resolved_time_zone.today.iso8601, reference: "UTR2")
      expect(claim.reload).to be_paid
      expect(PayrollExpenseReservation.find_by!(expense: claim).settled_at).to be_present
      expect(leg.payroll_payment_group.reload.fully_credited_at).to be_present
    end

    it "lets a later revision keep a claim this run already settled" do
      revision = build(expenses: [claim.id])
      approve(revision)
      verified_connection
      linked_recipient
      leg = Payroll::MercuryPayment.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:).first
      stub_mercury_reads
      stub_mercury_write(mercury_json(mercury_request("amount" => (leg.principal_minor / 100.0))))
      Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: leg.id, expected_digest: leg.frozen_digest)
      PayrollPaymentInstruction.find(leg.id).update!(request_status: "approved", transaction_status: "sent", transaction_link_state: "linked")
      Payroll::MercuryReconciliation.new(run).record_credit!(actor: accounts, instruction_id: leg.id, amount: "67500.00", credited_on: company.resolved_time_zone.today.iso8601, reference: "UTR1")
      expect(claim.reload).to be_paid
      newer = build(expenses: [claim.id])
      expect(newer.approval_issues).to eq([])
      approve(newer)
      expect(workflow.status).to eq("approved")
    end

    it "does not settle the claim from approval or a sent wire" do
      revision = build(expenses: [claim.id])
      approve(revision)
      expect(claim.reload).not_to be_paid
      expect(revision.reload.approval_issues).to eq([])
    end

    context "when a claim has a Mercury instruction" do
      let(:claim_revision) do
        revision = build(expenses: [claim.id])
        approve(revision)
        revision
      end
      let(:claim_instruction) { prepared_instruction(revision: claim_revision) }
      let(:claim_request) { mercury_request("amount" => claim_instruction.principal_minor / 100.0) }

      def submit_claim(timeout: false)
        if timeout
          stub_request(:post, "#{mercury_base}/account/#{account_id}/request-send-money").to_timeout
        else
          stub_mercury_write(mercury_json(claim_request))
        end
        Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: claim_instruction.id, expected_digest: claim_instruction.frozen_digest)
      end

      def refresh_claim(request_status: "approved", transaction_status: nil)
        transactions = transaction_status ? [mercury_transaction("status" => transaction_status, "amount" => -claim_instruction.principal_minor / 100.0)] : []
        stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(claim_request.merge("status" => request_status)))
        stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions})
          .to_return(mercury_json({ "total" => transactions.size, "transactions" => transactions }))
        Payroll::MercuryReconciliation.new(run).refresh!(actor: owner, instruction_id: claim_instruction.id)
      end

      def expect_claim_release_after_revision
        reservation = PayrollExpenseReservation.active.find_by!(expense: claim, payroll_revision: claim_revision)
        expect(claim_instruction.reload.released_at).to be_present
        expect(claim_instruction.credited_minor).to eq(0)
        expect(claim_instruction.payroll_payment_group.in_flight_legs).to be_empty
        expect(reservation.released_at).to be_nil
        replacement = build
        expect(run.current_revision.id).to eq(replacement.id)
        expect(reservation.reload.released_at).to be_present
        expect(claim.reload).to have_attributes(status: "approved", paid_at: nil)
        expect(claim).not_to be_payroll_reserved
      end

      def expect_claim_still_reserved
        reservation = PayrollExpenseReservation.active.find_by!(expense: claim, payroll_revision: claim_revision)
        expect(claim_instruction.reload.released_at).to be_nil
        expect(claim_instruction.payroll_payment_group.in_flight_legs).not_to be_empty
        expect { build }.to raise_error(Payroll::Workflow::Conflict, /A bank transfer exists/)
        expect(run.reload.current_revision.id).to eq(claim_revision.id)
        expect(reservation.reload.released_at).to be_nil
        expect(claim.reload).to have_attributes(status: "approved", paid_at: nil)
      end

      %w[rejected cancelled].each do |status|
        it "releases the claim after an unapproved #{status} request is closed and the revision is replaced" do
          submit_claim
          expect(refresh_claim(request_status: status).display_state).to eq("bank_#{status}")
          expect_claim_release_after_revision
        end
      end

      %w[failed cancelled].each do |status|
        it "releases the claim after an authoritative uncredited #{status} wire and a replacement revision" do
          submit_claim
          expect(refresh_claim(transaction_status: "pending").display_state).to eq("processing")
          expect(refresh_claim(transaction_status: status).display_state).to eq("transaction_#{status}")
          expect_claim_release_after_revision
        end
      end

      it "retains the claim when submission times out without a known bank outcome" do
        submit_claim(timeout: true)
        expect(claim_instruction.reload).to have_attributes(submission_state: "uncertain", last_error_code: "outcome_unknown")
        expect_claim_still_reserved
      end

      it "settles the original uncertain payment once after an unchanged revision is reapproved" do
        receipt = "description,amount,currency\nSynthetic travel,5000,INR\n"
        claim.receipts.attach(io: StringIO.new(receipt), filename: "synthetic-receipt.csv", content_type: "text/csv")
        receipt_id = claim.receipts.sole.blob_id
        submit_claim(timeout: true)
        bank_terms = claim_instruction.attributes.slice("principal_minor", "fee_minor", "company_debit_minor", "frozen_digest")
        expect(claim_instruction).to have_attributes(principal_minor: 80_357, fee_minor: 1_500, company_debit_minor: 81_857)
        reservation = PayrollExpenseReservation.active.find_by!(expense: claim, payroll_revision: claim_revision)
        replacement = build(expenses: [claim.id])
        expect(replacement.id).not_to eq(claim_revision.id)
        expect(reservation.reload).to have_attributes(released_at: nil, payroll_revision_id: claim_revision.id, amount_minor: 500_000)
        expect(claim.reload).to be_payroll_reserved

        approve(replacement)
        expect(PayrollExpenseReservation.active.where(expense: claim).sole.id).to eq(reservation.id)
        # Retained bank activity keeps claim attribution on its original instruction revision.
        expect(reservation.reload).to have_attributes(released_at: nil, payroll_revision_id: claim_revision.id, amount_minor: 500_000)
        expect(claim_instruction.reload).to have_attributes(submission_state: "uncertain", released_at: nil, payroll_revision_id: claim_revision.id)

        service = Payroll::MercuryReconciliation.new(run)
        stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(claim_request))
        service.confirm_request!(actor: owner, instruction_id: claim_instruction.id, request_id:)
        expect(refresh_claim(transaction_status: "sent")).to have_attributes(submission_state: "accepted", provider_request_id: request_id, transaction_status: "sent")
        expect(claim.reload).to have_attributes(status: "approved", paid_at: nil)
        expect(reservation.reload.settled_at).to be_nil
        credit = { actor: accounts, instruction_id: claim_instruction.id, amount: "67500.00", credited_on: Date.current.iso8601, reference: "Synthetic reapproved credit" }
        service.record_credit!(**credit)

        group = claim_instruction.payroll_payment_group
        expect(group.reload).to have_attributes(entitlement_minor: 6_750_000, payroll_revision_id: claim_revision.id)
        expect(claim.reload).to have_attributes(status: "paid", amount: 5_000, currency: "INR", user_id: worker.id)
        expect(reservation.reload).to have_attributes(payroll_revision_id: claim_revision.id, amount_minor: 500_000, released_at: nil)
        expect(reservation.settled_at).to be_present
        expect(claim.paid_at).to be_present
        expect(group.fully_credited_at).to be_present
        settled_at, paid_at, fully_credited_at = reservation.settled_at, claim.paid_at, group.fully_credited_at

        travel 5.minutes
        service.record_credit!(**credit)
        refresh_claim(transaction_status: "sent")
        expect(reservation.reload.settled_at).to eq(settled_at)
        expect(claim.reload.paid_at).to eq(paid_at)
        expect(group.reload.fully_credited_at).to eq(fully_credited_at)
        expect(claim_instruction.reload).to have_attributes(credit_state: "credited", credited_minor: 6_750_000, entitlement_currency: "INR")
        expect(claim_instruction.attributes.slice(*bank_terms.keys)).to eq(bank_terms)
        expect(PayrollPaymentInstruction.where(payroll_run: run, employment:).open_slot.sole.id).to eq(claim_instruction.id)
        expect(claim.receipts.sole.blob_id).to eq(receipt_id)
        expect(claim.receipts.sole.download).to eq(receipt)
        expect(claim_instruction.payroll_payment_events.where(kind: "credit_recorded").sole.data).to include("currency" => "INR", "amount_minor" => 6_750_000)
        expect(claim_instruction.payroll_payment_events.where(kind: "group_fully_credited").count).to eq(1)
        expect(claim_instruction.payroll_payment_events.where(kind: "group_credit_reopened")).to be_empty
        expect(PayrollExpenseReservation.where(expense: claim).count).to eq(1)
        expect(a_request(:post, "#{mercury_base}/account/#{account_id}/request-send-money")).to have_been_made.once
      end

      it "retains the claim when cancellation follows bank approval without transaction proof" do
        submit_claim
        refresh_claim
        expect(claim_instruction.reload.request_approved_at).to be_present
        expect(refresh_claim(request_status: "cancelled").held_reason).to eq("cancelled_after_approval")
        expect_claim_still_reserved
      end

      it "retains the claim when a failed wire follows partial credit" do
        submit_claim
        refresh_claim(transaction_status: "sent")
        Payroll::MercuryReconciliation.new(run).record_credit!(actor: accounts, instruction_id: claim_instruction.id,
          amount: "1000.00", credited_on: Date.current.iso8601, reference: "Synthetic partial credit")
        expect(refresh_claim(transaction_status: "failed")).to have_attributes(held_reason: "failed_after_sent", credit_state: "partial", credited_minor: 100_000)
        expect_claim_still_reserved
        expect { claim.reload.mark_paid! }.to raise_error(ActiveRecord::RecordInvalid, /reserved/)
      end
    end

    context "when a claim is approved after the payroll cutoff" do
      let(:cutoff) { "2026-11-30" }

      before do
        company.update!(timezone: "Asia/Kolkata")
        travel_to(Time.utc(2027, 1, 5, 12))
      end

      it "carries a claim approved after cutoff into the next run" do
        row = builder.preparation(cutoff:).find { |entry| entry[:employment_id] == employment.id }
        expect(row[:eligible_expenses]).to be_empty
        expect(row[:excluded_expenses]).to include("approved_after_cutoff" => 1)
        expect { build(expenses: [claim.id]) }.to raise_error(Payroll::ConsultantReview::InvalidInput, /no longer eligible/)
        previous = build
        approve(previous)
        expect(claim.reload.payroll_reserved?).to be(false)

        later = PayrollRun.create!(company:, period: Date.new(2026, 12, 1), currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
        create(:timesheet_entry, user: worker, project: work_entry.project, work_date: Date.new(2026, 12, 2), duration: 480)
        record_synthetic_pto_treatment(period: later.period)
        next_builder = described_class.new(later, actor: accounts)
        next_row = next_builder.preparation(cutoff: Date.current.iso8601).find { |entry| entry[:employment_id] == employment.id }
        expect(next_row[:eligible_expenses].pluck(:id)).to eq([claim.id])
        revision = next_builder.create!(
          consultants: [{ employment_id: employment.id, expense_ids: [claim.id], acknowledged: true }],
          cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "carried-claim")
        next_workflow = Payroll::Workflow.new(later)
        next_workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
        next_workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)

        expect(previous.reload.payroll_payload.fetch("lines").first.fetch("reimbursements")).to be_empty
        expect(run.current_revision.id).to eq(previous.id)
        expect(workflow.status).to eq("approved")
        expect(PayrollExpenseReservation.active.where(expense: claim).sole).to have_attributes(payroll_run_id: later.id, payroll_revision_id: revision.id, amount_minor: 500_000)
        expect(claim.reload).to have_attributes(status: "approved", paid_at: nil)
      end
    end
  end
end
