# frozen_string_literal: true

require "rails_helper"

RSpec.describe Payroll::IndiaHandoff do
  before do |example|
    if example.metadata[:india_concurrency]
      DatabaseCleaner.clean
      DatabaseCleaner.strategy = :deletion
      DatabaseCleaner.start
    end
  end

  include_context "approved mercury consultant payroll"

  let(:service) { described_class.new(run) }
  let(:mailbox) { "synthetic-accounts@example.test" }

  around do |example|
    travel_to(Time.utc(2026, 12, 5, 12)) { example.run }
  end

  before do
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 62_500,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: legal_name, change_reason: "Synthetic India terms")
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment
  end

  def queue_handoff(revision = approve_revision)
    service.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
      accounts_email: mailbox, bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
  end

  def delivered(handoff)
    handoff.payroll_india_deliveries.last.update!(state: "sent", sent_at: Time.current)
    handoff
  end

  def credit(handoff, amount: "1000.00", reference: "Synthetic credit", credited_on: Date.current.iso8601, actor: accounts)
    service.record_credit!(actor:, handoff_id: handoff.id, amount:, reference:, credited_on:)
  end

  %w[bank_country bank_account_currency].each do |field|
    it "refuses a new handoff without the declared #{field}" do
      details = bank_details.merge("bank_country" => "IN", "bank_account_currency" => "INR").except(field)
      employment.employee_record.update!(private_details: details)

      expect { queue_handoff }.to raise_error(Payroll::MercuryPayment::Blocked) do |error|
        expect(error.codes).to include("bank_profile_incomplete")
      end
      expect(PayrollIndiaHandoff.where(payroll_run: run)).to be_empty
    end
  end

  it "requires approval and explicit bank and single mailbox confirmation" do
    revision = workflow.revise!(actor: accounts, payload: synthetic_payload, idempotency_key: "draft", expected_digest: nil)
    expect { queue_handoff(revision) }.to raise_error(Payroll::MercuryPayment::Blocked) { |error| expect(error.codes).to include("run_not_approved") }
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    expect { service.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, accounts_email: mailbox, bank_confirmed: false,
      expected_bank_digest: synthetic_india_bank_digest) }
      .to raise_error(Payroll::MercuryPayment::Blocked)
    expect { service.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, accounts_email: "a@example.test,b@example.test", bank_confirmed: true,
      expected_bank_digest: synthetic_india_bank_digest) }
      .to raise_error(Payroll::MercuryPayment::Blocked)
  end

  it "requires the bank version the owner reviewed before creating a handoff" do
    revision = approve_revision
    expect do
      service.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
        accounts_email: mailbox, bank_confirmed: true)
    end.to raise_error(Payroll::Workflow::Conflict, /Bank details changed/)
    expect(PayrollIndiaHandoff.where(payroll_run: run)).to be_empty
  end

  it "rejects a bank change after preview until the owner reviews the fresh beneficiary version" do
    revision = approve_revision
    bank_version = service.preview(employment_id: employment.id).fetch(:report).fetch("bank_digest")
    changed_details = bank_details.merge("bank_account_number" => "999999999999")
    employment.employee_record.update!(private_details: changed_details)
    expect do
      service.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
        accounts_email: mailbox, bank_confirmed: true, expected_bank_digest: bank_version)
    end.to raise_error(Payroll::Workflow::Conflict, "Bank details changed; reload and verify the beneficiary again")
    expect(PayrollIndiaHandoff.where(payroll_run: run)).to be_empty
    expect(PayrollIndiaDelivery.joins(:payroll_india_handoff).where(payroll_india_handoffs: { payroll_run_id: run.id })).to be_empty

    fresh_version = service.preview(employment_id: employment.id).fetch(:report).fetch("bank_digest")
    expect(fresh_version).not_to eq(bank_version)
    handoff = service.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
      accounts_email: mailbox, bank_confirmed: true, expected_bank_digest: fresh_version)
    expect(handoff.report.fetch("bank_details")).to eq(changed_details)
    expect(handoff.payroll_india_deliveries.sole.state).to eq("queued")
    expect do
      service.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
        accounts_email: mailbox, bank_confirmed: true, expected_bank_digest: bank_version)
    end.to raise_error(Payroll::Workflow::Conflict, /Bank details changed/)
    expect(handoff.payroll_india_deliveries.count).to eq(1)
  end

  it "rejects structured, nonpositive and malformed record IDs at the service boundary" do
    revision = approve_revision
    [[], {}, true, false, nil, "-1", 0, "1.0", "1e3"].each do |id|
      expect { service.create!(actor: owner, employment_id: id, expected_digest: revision.digest, accounts_email: mailbox, bank_confirmed: true,
        expected_bank_digest: synthetic_india_bank_digest) }
        .to raise_error(Payroll::MercuryPayment::Blocked)
      expect { service.void!(actor: owner, handoff_id: id) }.to raise_error(Payroll::MercuryPayment::Blocked)
    end
  end

  it "freezes an encrypted report and refuses duplicate queues" do
    handoff = queue_handoff
    expect(handoff.report).to include("accounts_email" => mailbox, "monthly_fee" => "62500.0", "legal_entity" => legal_name)
    expect(handoff.report.dig("bank_details", "bank_account_number")).to eq(bank_details["bank_account_number"])
    expect(handoff.status).to eq("queued")
    expect(handoff.payroll_india_deliveries.sole.attempt_number).to eq(1)
    raw = PayrollIndiaHandoff.connection.select_value("SELECT report FROM payroll_india_handoffs WHERE id = #{handoff.id}")
    expect(raw).not_to include(mailbox, bank_details["bank_account_number"])
    expect(handoff.to_json).not_to include(mailbox, bank_details["bank_account_number"])
    expect(handoff.to_json(only: [:report])).not_to include(mailbox, bank_details["bank_account_number"])
    expect(handoff.inspect).not_to include(mailbox, bank_details["bank_account_number"])
    expect(queue_handoff(run.current_revision).id).to eq(handoff.id)
    expect(handoff.payroll_india_deliveries.count).to eq(1)
    expect { service.create!(actor: owner, employment_id: employment.id, expected_digest: run.current_revision.digest,
      accounts_email: "different@example.test", bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest) }.to raise_error(Payroll::Workflow::Conflict)
  end

  it "rechecks bank, source and creator authorization before dispatch" do
    handoff = queue_handoff
    expect(service.dispatch_blocker(handoff)).to be_nil
    employment.employee_record.update!(private_details: bank_details.merge("bank_ifsc" => "CHNG0000001"))
    expect(service.dispatch_blocker(handoff)).to eq("bank_details_changed")
    employment.employee_record.update!(private_details: bank_details)
    owner.update!(current_workspace: create(:company))
    expect(service.dispatch_blocker(handoff)).to eq("creator_no_longer_authorized")
  end

  it "protects queued handoffs from changed revisions, reservation release and funding changes until voided" do
    handoff = queue_handoff
    expect { workflow.revise!(actor: accounts, payload: synthetic_payload(amount_minor: 6_200_000), idempotency_key: "changed", expected_digest: run.current_revision.digest) }
      .to raise_error(ActiveRecord::RecordInvalid, /bank activity|handoff/)
    payload = run.current_revision.payroll_payload.deep_dup
    payload["lines"] = []
    expect { Payroll::MercuryRevisionGuard.new(run).check!(payload) }.to raise_error(Payroll::Workflow::Conflict)
    service.void!(actor: owner, handoff_id: handoff.id)
    expect(handoff.reload.status).to eq("voided")
  end

  it "records partial/full/overcredit exactly once using frozen entitlement after live bank changes" do
    handoff = delivered(queue_handoff)
    employment.employee_record.update!(private_details: bank_details.merge("bank_account_number" => "999999999999",
      "bank_name" => "Changed Bank", "bank_country" => "US", "bank_account_currency" => "USD"))
    work_entry.update!(duration: 420)
    credit(handoff)
    expect(handoff.reload).to have_attributes(credited_minor: 100_000, fully_credited_at: nil)
    expect(handoff.status).to eq("partially_credited")
    credit(handoff)
    expect(handoff.payroll_india_credits.count).to eq(1)
    expect { credit(handoff, amount: "1001.00") }.to raise_error(Payroll::Workflow::Conflict)
    expect { credit(handoff, amount: "62000.00", reference: "Synthetic balance") }.to have_enqueued_job(PayrollConsultantInvoiceIssueJob).with(run.id, employment.id)
    expect(handoff.reload.credited_minor).to eq(6_300_000)
    expect(handoff.fully_credited_at).to be_present
    expect(handoff.status).to eq("credited")
    expect(handoff.report.fetch("bank_details")).to eq(bank_details)
    stamp = handoff.fully_credited_at
    credit(handoff, amount: "1.00", reference: "Synthetic overcredit")
    expect(handoff.reload.fully_credited_at).to eq(stamp)
    expect { handoff.payroll_india_credits.first.update!(amount_minor: 1) }.to raise_error(ActiveRecord::ReadOnlyRecord)
  end

  it "requires assigned accounts and strict positive INR credit values" do
    handoff = delivered(queue_handoff)
    expect { credit(handoff, actor: owner) }.to raise_error(Payroll::Workflow::NotAuthorized)
    ["1e3", "1.001", "NaN", "-1", 1, "0"].each do |amount|
      expect { credit(handoff, amount:) }.to raise_error(Payroll::MercuryPayment::Blocked)
    end
    ["2026-10-31", "2026-12-06", "2026-11-31", "2026-1-1"].each do |credited_on|
      expect { credit(handoff, credited_on:) }.to raise_error(Payroll::MercuryPayment::Blocked)
    end
    company.update!(timezone: "America/New_York")
    travel_to(Time.utc(2026, 12, 6, 1))
    expect { credit(handoff, credited_on: "2026-12-06") }.to raise_error(Payroll::MercuryPayment::Blocked)
    credit(handoff, credited_on: "2026-12-05")
  end

  it "never voids or retries a delivered or partially credited handoff" do
    handoff = delivered(queue_handoff)
    expect { service.void!(actor: owner, handoff_id: handoff.id) }.to raise_error(Payroll::MercuryPayment::Blocked)
    expect { service.retry!(actor: owner, handoff_id: handoff.id) }.to raise_error(Payroll::MercuryPayment::Blocked)
    credit(handoff)
    expect { service.void!(actor: owner, handoff_id: handoff.id) }.to raise_error(Payroll::MercuryPayment::Blocked)
    expect { service.retry!(actor: owner, handoff_id: handoff.id) }.to raise_error(Payroll::MercuryPayment::Blocked)
    expect(handoff.payroll_india_deliveries.count).to eq(1)
  end

  it "permits known-unsent retry but requires evidence and stopped worker to reconcile uncertainty" do
    handoff = queue_handoff
    attempt = handoff.payroll_india_deliveries.sole
    attempt.update!(state: "uncertain")
    expect { service.retry!(actor: owner, handoff_id: handoff.id) }.to raise_error(Payroll::MercuryPayment::Blocked)
    expect { service.void!(actor: owner, handoff_id: handoff.id) }.to raise_error(Payroll::MercuryPayment::Blocked)
    expect { service.reconcile_delivery!(actor: accounts, handoff_id: handoff.id, outcome: "not_delivered", evidence_reference: "Synthetic evidence", worker_stopped: false) }
      .to raise_error(Payroll::MercuryPayment::Blocked)
    service.reconcile_delivery!(actor: accounts, handoff_id: handoff.id, outcome: "not_delivered", evidence_reference: "Synthetic evidence", worker_stopped: true)
    expect(attempt.reload.to_json).not_to include("Synthetic evidence")
    service.retry!(actor: owner, handoff_id: handoff.id)
    expect(handoff.payroll_india_deliveries.order(:attempt_number).pluck(:state)).to eq(%w[failed queued])
  end

  it "rejects source changes with unchanged money and protects unchanged lines during another revision" do
    handoff = queue_handoff
    original = run.current_revision
    recaptured = original.payroll_payload.deep_dup
    recaptured["lines"].first["source_snapshot"]["captured_at"] = 1.hour.from_now.iso8601
    expect { Payroll::MercuryRevisionGuard.new(run).check!(recaptured) }.not_to raise_error
    recaptured["lines"].first["preparation"] = { "confirmed_unpaid_hours" => "1" }
    expect { Payroll::MercuryRevisionGuard.new(run).check!(recaptured) }.to raise_error(Payroll::Workflow::Conflict)
    identical = workflow.revise!(actor: accounts, payload: original.payroll_payload, idempotency_key: "same-line", expected_digest: original.digest)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: identical.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: identical.digest)
    expect(service.dispatch_blocker(handoff)).to be_nil
    work_entry.update!(duration: 420)
    expect(service.dispatch_blocker(handoff)).to eq("run_not_approved")
  end

  it "blocks stale workspace, revoked approval, and non-India or split funded preparation" do
    revision = approve_revision
    owner.update!(current_workspace: create(:company))
    expect { queue_handoff(revision) }.to raise_error(Payroll::Workflow::NotAuthorized)
    owner.update!(current_workspace: company)
    accounts.remove_role(:book_keeper, company)
    expect { queue_handoff(revision) }.to raise_error(Payroll::MercuryPayment::Blocked)
  end

  it "rejects Mercury funding and any pending split arrangement" do
    terms = employment.consultant_compensations.order(:id).last
    ConsultantCompensation.create!(terms.attributes.except("id", "created_at", "updated_at").merge("payment_source" => "mercury_us"))
    record_synthetic_pto_treatment
    revision = approve_revision
    expect { queue_handoff(revision) }.to raise_error(Payroll::MercuryPayment::Blocked) { |error| expect(error.codes).to include("funding_not_india") }
    ConsultantCompensation.create!(terms.attributes.except("id", "created_at", "updated_at"))
    record_synthetic_pto_treatment
    revision = approve_revision(parent: revision.digest)
    PayrollSplitArrangement.create!(company:, employment:, requested_by: owner, details: bank_details.merge("bank_country" => "IN").slice(*PayrollSplitArrangement::DETAIL_KEYS),
      allocation_kind: "percentage", allocation_value: 50, allocated_to: "spouse", remainder_to: "consultant")
    expect { queue_handoff(revision) }.to raise_error(Payroll::MercuryPayment::Blocked) { |error| expect(error.codes).to include("split_not_supported") }
  end

  it "freezes report fields and credit evidence even against direct SQL updates" do
    handoff = delivered(queue_handoff)
    credit(handoff)
    expect do
      PayrollIndiaHandoff.transaction(requires_new: true) { PayrollIndiaHandoff.where(id: handoff.id).update_all(report: { "tampered" => true }) }
    end.to raise_error(ActiveRecord::StatementInvalid, /immutable/)
    expect do
      PayrollIndiaCredit.transaction(requires_new: true) { handoff.payroll_india_credits.update_all(amount_minor: 1) }
    end.to raise_error(ActiveRecord::StatementInvalid, /immutable/)
    expect do
      PayrollIndiaDelivery.transaction(requires_new: true) { handoff.payroll_india_deliveries.update_all(attempt_number: 2) }
    end.to raise_error(ActiveRecord::StatementInvalid, /immutable/)
    expect(handoff.reload.entitlement_minor).to eq(6_250_000)
    expect(handoff.payroll_india_credits.sole.amount_minor).to eq(100_000)
  end

  it "prevents direct SQL from reducing actual credit or changing its final credit timestamp" do
    handoff = delivered(queue_handoff)
    credit(handoff, amount: "62500.00")
    stamp = handoff.reload.fully_credited_at
    [{ credited_minor: 0 }, { fully_credited_at: nil }, { fully_credited_at: stamp + 1.second }].each do |attributes|
      expect do
        PayrollIndiaHandoff.transaction(requires_new: true) { PayrollIndiaHandoff.where(id: handoff.id).update_all(attributes) }
      end.to raise_error(ActiveRecord::StatementInvalid, /cannot go backwards/)
    end
    credit(handoff, amount: "1.00", reference: "Synthetic additional actual credit")
    expect(handoff.reload).to have_attributes(credited_minor: 6_250_100, fully_credited_at: stamp)
  end

  it "prevents direct SQL from reopening or redating a voided handoff" do
    handoff = queue_handoff
    service.void!(actor: owner, handoff_id: handoff.id)
    stamp = handoff.reload.released_at
    [nil, stamp + 1.second].each do |value|
      expect do
        PayrollIndiaHandoff.transaction(requires_new: true) { PayrollIndiaHandoff.where(id: handoff.id).update_all(released_at: value) }
      end.to raise_error(ActiveRecord::StatementInvalid, /cannot go backwards/)
    end
    expect(handoff.reload.released_at).to eq(stamp)
  end

  it "normalizes credit references and rejects cross-handoff replay" do
    first = delivered(queue_handoff)
    credit(first, reference: " abc 123 ")
    credit(first, reference: "ABC123")
    expect(first.payroll_india_credits.count).to eq(1)
    evidence = first.payroll_india_credits.sole
    expect(evidence.to_json).not_to include("ABC123")
    expect(evidence.inspect).not_to include("ABC123")
    raw = PayrollIndiaCredit.connection.select_value("SELECT reference FROM payroll_india_credits WHERE id = #{evidence.id}")
    expect(raw).not_to include("ABC123")
    expect { credit(first, reference: "abc123", credited_on: "2026-12-04") }.to raise_error(Payroll::Workflow::Conflict)
    other = create(:employment, company:, resigned_at: nil)
    other_terms = ConsultantCompensation.create!(employment: other, created_by: owner, effective_on: run.period,
      monthly_fee: 62_500, hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india",
      legal_entity_name: legal_name, change_reason: "Synthetic other consultant")
    duplicate = PayrollIndiaHandoff.create!(company:, payroll_run: run, payroll_revision: first.payroll_revision,
      employment: other, consultant_compensation: other_terms, created_by: owner, report: first.report,
      line_digest: first.line_digest, bank_digest: first.bank_digest, entitlement_minor: first.entitlement_minor)
    expect { credit(duplicate, reference: "ABC123") }.to raise_error(Payroll::Workflow::Conflict)
  end

  it "preserves credit replay protection when the session-signing key rotates" do
    handoff = delivered(queue_handoff)
    credit(handoff, reference: "SYNTHETIC-UTR-STABLE")
    allow(Rails.application).to receive(:key_generator).and_return(ActiveSupport::KeyGenerator.new("rotated-synthetic-session-key"))
    credit(handoff, reference: "synthetic-utr-stable")
    expect(handoff.payroll_india_credits.count).to eq(1)
    expect(handoff.reload.credited_minor).to eq(100_000)
  end

  it "does not depend on Rails key-generator defaults or Unicode formatting for credit identity" do
    handoff = delivered(queue_handoff)
    credit(handoff, reference: "UTR123")
    allow(ActiveSupport::KeyGenerator).to receive(:hash_digest_class).and_return(OpenSSL::Digest::SHA512)
    credit(handoff, reference: "ＵＴＲ１２３")
    expect(handoff.payroll_india_credits.count).to eq(1)
    expect(handoff.reload.credited_minor).to eq(100_000)
  end

  it "rejects credit when its stable reference key is unavailable" do
    handoff = delivered(queue_handoff)
    allow(ActiveRecord::Encryption.config).to receive(:deterministic_key).and_return(nil)
    expect { credit(handoff) }.to raise_error(ActiveRecord::Encryption::Errors::Configuration)
    expect(handoff.payroll_india_credits.count).to eq(0)
  end

  it "blocks the handoff before accounts can pay when the stable reference key is missing" do
    revision = approve_revision
    allow(ActiveRecord::Encryption.config).to receive(:has_deterministic_key?).and_return(nil)
    expect(service.preview(employment_id: employment.id).fetch(:blockers)).to include("payroll_reference_key_missing")
    expect { queue_handoff(revision) }.to raise_error(Payroll::MercuryPayment::Blocked)
    expect(PayrollIndiaHandoff.count).to eq(0)
  end

  it "serializes retroactive compensation creation with a new handoff", :india_concurrency do
    revision = approve_revision
    terms = employment.consultant_compensations.order(:id).last.attributes.except("id", "created_at", "updated_at")
    backend = Queue.new
    worker_thread = nil
    run.with_lock do
      worker_thread = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |connection|
          backend << connection.select_value("SELECT pg_backend_pid()")
          begin
            ConsultantCompensation.create!(terms.merge("payment_source" => "mercury_us"))
          rescue ActiveRecord::RecordInvalid => error
            error
          end
        end
      end
      Timeout.timeout(5) do
        pid = backend.pop
        sleep 0.01 until PayrollRun.connection.select_value("SELECT pg_backend_pid() = ANY(pg_blocking_pids(#{Integer(pid)}))")
      end
      queue_handoff(revision)
    end
    expect(Timeout.timeout(5) { worker_thread.value }).to be_a(ActiveRecord::RecordInvalid)
    expect(employment.consultant_compensations.order(:id).last.payment_source).to eq("india")
  ensure
    worker_thread&.join(5)
  end

  context "with reserved reimbursements" do
    let!(:claim) do
      expense = create(:expense, company:, user: worker, amount: 5_000, currency: "INR", date: Date.new(2026, 11, 2), status: :approved, approved_at: 1.minute.ago)
      expense.receipts.attach(io: File.open(Rails.root.join("spec/support/fixtures/pdf-file.pdf")), filename: "synthetic-receipt.pdf", content_type: "application/pdf")
      expense
    end

    def claim_handoff
      revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(
        consultants: [{ employment_id: employment.id, expense_ids: [claim.id], acknowledged: true }],
        cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "claim-revision")
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
      queue_handoff(revision)
    end

    it "retains reservations while queued, unchanged revisions and partial credits, then settles once" do
      handoff = claim_handoff
      reservation = PayrollExpenseReservation.active.find_by!(expense: claim)
      Payroll::MercuryRevisionGuard.new(run).after_revision!(accounts)
      expect(reservation.reload.released_at).to be_nil
      delivered(handoff)
      credit(handoff)
      expect(reservation.reload.settled_at).to be_nil
      expect(claim.reload.paid_at).to be_nil
      credit(handoff, amount: "66500.00", reference: "Synthetic balance")
      expect(handoff.reload.status).to eq("credited")
      expect(claim.reload).to be_paid
      expect(claim).to have_attributes(amount: BigDecimal("5000"), currency: "INR", date: Date.new(2026, 11, 2))
      expect(reservation.reload.employment_id).to eq(employment.id)
      expect(claim.receipts.sole.download).to eq(File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")))
      settled_at, paid_at = reservation.reload.settled_at, claim.paid_at
      travel 2.minutes
      credit(handoff, amount: "66500.00", reference: "Synthetic balance")
      expect(reservation.reload.settled_at).to eq(settled_at)
      expect(claim.reload.paid_at).to eq(paid_at)
    end

    it "keeps actual credit when claims change and safely retries settlement on exact replay" do
      handoff = delivered(claim_handoff)
      reservation = PayrollExpenseReservation.active.find_by!(expense: claim)
      reservation.update!(released_at: Time.current)
      credit(handoff, amount: "67500.00")
      expect(handoff.reload).to have_attributes(credited_minor: 6_750_000, fully_credited_at: nil)
      expect(handoff.status).to eq("settlement_blocked")
      expect(claim.reload.paid_at).to be_nil
      reservation.update!(released_at: nil)
      credit(handoff, amount: "67500.00")
      expect(handoff.reload.status).to eq("credited")
      expect(handoff.payroll_india_credits.count).to eq(1)
      expect(claim.reload).to be_paid
    end

    it "releases known-unsent claims only after void and a replacement revision" do
      handoff = claim_handoff
      reservation = PayrollExpenseReservation.active.find_by!(expense: claim)
      service.void!(actor: owner, handoff_id: handoff.id)
      expect(reservation.reload.released_at).to be_nil
      Payroll::ConsultantRevision.new(run, actor: accounts).create!(
        consultants: [{ employment_id: employment.id, expense_ids: [], acknowledged: true }],
        cutoff: Date.current.iso8601, expected_digest: run.current_revision.digest, idempotency_key: "voided-revision")
      expect(reservation.reload.released_at).to be_present
      expect(claim.reload).to have_attributes(status: "approved", paid_at: nil)
    end

    it "refuses to settle unexpected claims and retains the actual credit" do
      handoff = delivered(claim_handoff)
      extra = create(:expense, company:, user: worker, amount: 50, currency: "INR", date: Date.new(2026, 11, 3), status: :approved, approved_at: 1.minute.ago)
      PayrollExpenseReservation.create!(company:, expense: extra, payroll_run: run, payroll_revision: handoff.payroll_revision,
        employment:, amount_minor: 5_000)
      credit(handoff, amount: "67500.00")
      expect(handoff.reload.status).to eq("settlement_blocked")
      expect(handoff.credited_minor).to eq(6_750_000)
      expect(claim.reload.paid_at).to be_nil
      expect(extra.reload.paid_at).to be_nil
    end

    it "serializes two distinct actual credits and settles the reserved claim once", :india_concurrency do
      handoff = delivered(claim_handoff)
      ready, start = Queue.new, Queue.new
      run_id, handoff_id, actor_id = run.id, handoff.id, accounts.id
      workers = 2.times.map do |number|
        Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            ready << true
            start.pop
            Payroll::IndiaHandoff.new(PayrollRun.find(run_id)).record_credit!(actor: User.find(actor_id), handoff_id:,
              amount: "33750.00", credited_on: "2026-12-05", reference: "Concurrent credit #{number}")
          end
        end
      end
      Timeout.timeout(10) do
        2.times { ready.pop }
        2.times { start << true }
        workers.each(&:value)
      end
      expect(handoff.reload).to have_attributes(credited_minor: 6_750_000)
      expect(handoff.status).to eq("credited")
      expect(handoff.payroll_india_credits.count).to eq(2)
      expect(PayrollExpenseReservation.active.where(expense: claim).sole.settled_at).to be_present
      expect(claim.reload).to be_paid
    ensure
      2.times { start << true } if start
      workers&.each { |worker_thread| worker_thread.join(5) }
    end

    it "retains the report and settles its claim when a changed revision races with full credit", :india_concurrency do
      handoff = delivered(claim_handoff)
      original = run.current_revision
      changed = original.payroll_payload.deep_dup
      changed["lines"].first["reimbursements"] = []
      ready, start = Queue.new, Queue.new
      run_id, handoff_id, actor_id = run.id, handoff.id, accounts.id
      operations = [
        -> { Payroll::IndiaHandoff.new(PayrollRun.find(run_id)).record_credit!(actor: User.find(actor_id), handoff_id:,
          amount: "67500.00", credited_on: "2026-12-05", reference: "Racing actual credit") },
        -> { Payroll::Workflow.new(PayrollRun.find(run_id)).revise!(actor: User.find(actor_id), payload: changed,
          expected_digest: original.digest, idempotency_key: "racing-revision") }
      ]
      workers = operations.map do |operation|
        Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            ready << true
            start.pop
            begin
              operation.call
            rescue Payroll::Workflow::Conflict => error
              error
            end
          end
        end
      end
      results = Timeout.timeout(10) do
        2.times { ready.pop }
        2.times { start << true }
        workers.map(&:value)
      end
      expect(results.grep(Payroll::Workflow::Conflict).size).to eq(1)
      expect(run.current_revision.id).to eq(original.id)
      expect(handoff.reload.status).to eq("credited")
      expect(PayrollExpenseReservation.active.where(expense: claim).sole.settled_at).to be_present
      expect(claim.reload).to be_paid
    ensure
      2.times { start << true } if start
      workers&.each { |worker_thread| worker_thread.join(5) }
    end
  end
end
