# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PTO ledger database and concurrency boundaries" do
  before do |example|
    if example.metadata[:pto_concurrency]
      DatabaseCleaner.clean
      DatabaseCleaner.strategy = :deletion
      DatabaseCleaner.start
    end
  end
  include_context "approved mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }
  let(:ledger) { Payroll::PtoLedger.new(employment, actor: owner) }

  before do
    employment.update!(joined_at: Date.new(2020, 1, 1))
    ledger.configure!(effective_on: "2026-11-01", opening_on: "2026-11-01", opening_hours: "0",
      monthly_accrual_hours: "16", accrual_day: "1", leave_year_month: "4", leave_year_day: "1", carry_rule: "review",
      rate_basis: "origin_period_fee", advance_limit_hours: "200", exception_threshold_hours: "8", negative_threshold_hours: "8",
      reason: "Synthetic approved policy", evidence: "Synthetic reconciled opening", idempotency_key: "policy")
  end

  def decision(kind = "advance")
    facts = Payroll::PtoFacts.new(employment, month: run.period).call
    ledger.decide!(period: run.period, kind:, reason: "Synthetic explicit decision", expected_digest: facts.fetch("digest"), idempotency_key: SecureRandom.uuid)
  end

  it "rejects cross-tenant rows and database updates even outside model callbacks" do
    entry = decision
    foreign = create(:employment)
    attributes = entry.attributes.except("id").merge("employment_id" => foreign.id, "idempotency_key" => "foreign")
    expect do
      ApplicationRecord.transaction(requires_new: true) { PayrollPtoEntry.insert_all!([attributes]) }
    end.to raise_error(ActiveRecord::InvalidForeignKey)
    expect do
      ApplicationRecord.transaction(requires_new: true) { PayrollPtoEntry.where(id: entry.id).update_all(minutes: 0) }
    end.to raise_error(ActiveRecord::StatementInvalid, /immutable/)
  end

  it "refuses fabricated settlement roots and over-allocation through direct inserts" do
    entry = decision("unpaid")
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(consultants: [{ employment_id: employment.id, acknowledged: true }],
      cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "snapshot")
    expect do
      ApplicationRecord.transaction(requires_new: true) do
        PayrollPtoRecovery.create!(company:, employment:, payroll_pto_entry: entry, payroll_run: run,
          payroll_revision: revision, kind: "settled", amount_minor: 1)
      end
    end.to raise_error(ActiveRecord::StatementInvalid, /transition/)
    advance = decision
    ledger.accrue!(through: Date.new(2026, 12, 1))
    accrual = PayrollPtoEntry.find_by!(employment:, kind: "accrual")
    expect do
      ApplicationRecord.transaction(requires_new: true) do
        PayrollPtoAllocation.create!(company:, employment:, origin_entry: advance, accrual_entry: accrual, minutes: 100_000)
      end
    end.to raise_error(ActiveRecord::StatementInvalid)
  end

  it "serializes two stale competing decisions on independent PostgreSQL connections", :pto_concurrency do
    digest = Payroll::PtoFacts.new(employment, month: run.period).call.fetch("digest")
    backend = Queue.new
    worker_thread = nil
    run.with_lock do
      worker_thread = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |connection|
          backend << connection.select_value("SELECT pg_backend_pid()")
          begin
            Payroll::PtoLedger.new(Employment.find(employment.id), actor: User.find(owner.id)).decide!(period: run.period, kind: "unpaid",
              reason: "Synthetic concurrent decision", expected_digest: digest, idempotency_key: "competing")
          rescue Payroll::Workflow::Conflict => error
            error
          end
        end
      end
      Timeout.timeout(5) do
        pid = backend.pop
        sleep 0.01 until PayrollRun.connection.select_value("SELECT pg_backend_pid() = ANY(pg_blocking_pids(#{Integer(pid)}))")
      end
      decision("defer")
    end
    expect(Timeout.timeout(5) { worker_thread.value }).to be_a(Payroll::Workflow::Conflict)
    expect(PayrollPtoEntry.where(employment:, kind: "unpaid")).to be_empty
    expect(PayrollPtoEntry.where(employment:, kind: "defer").count).to eq(1)
  ensure
    worker_thread&.join(5)
  end

  it "resolves the latest accrual policy only after acquiring the employment serialization lock", :pto_concurrency do
    backend = Queue.new
    worker_thread = nil
    newest = nil
    employment.with_lock do
      worker_thread = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |connection|
          backend << connection.select_value("SELECT pg_backend_pid()")
          Payroll::PtoLedger.new(Employment.find(employment.id), actor: User.find(owner.id)).accrue!(through: Date.new(2026, 12, 1))
        end
      end
      Timeout.timeout(5) do
        pid = backend.pop
        sleep 0.01 until PayrollRun.connection.select_value("SELECT pg_backend_pid() = ANY(pg_blocking_pids(#{Integer(pid)}))")
      end
      newest = ledger.configure!(effective_on: "2026-12-01", opening_on: "2026-11-01", opening_hours: "0", monthly_accrual_hours: "8",
        accrual_day: "1", leave_year_month: "4", leave_year_day: "1", carry_rule: "review", rate_basis: "origin_period_fee",
        advance_limit_hours: "200", exception_threshold_hours: "8", negative_threshold_hours: "8", reason: "Synthetic concurrent approved policy",
        evidence: "Synthetic reconciled opening", idempotency_key: "concurrent-policy")
    end
    Timeout.timeout(5) { worker_thread.value }
    credit = PayrollPtoEntry.find_by!(employment:, kind: "accrual")
    expect(credit.consultant_pto_policy_id).to eq(newest.id)
    expect(credit.minutes / 60).to eq(8)
    expect do
      ApplicationRecord.transaction(requires_new: true) do
        PayrollPtoEntry.insert_all!([credit.attributes.except("id").merge(
          "consultant_pto_policy_id" => ConsultantPtoPolicy.where(employment:).minimum(:id),
          "minutes" => 960, "balance_delta_minutes" => 960, "case_key" => "raw-stale-credit", "idempotency_key" => "raw-stale-credit")])
      end
    end.to raise_error(ActiveRecord::StatementInvalid, /latest applicable earned policy/)
  ensure
    worker_thread&.join(5)
  end

  it "refuses cash recovery of the same hours already allocated from accrual through direct SQL" do
    advance = decision
    ledger.accrue!(through: Date.new(2026, 12, 1))
    expect do
      ApplicationRecord.transaction(requires_new: true) do
        PayrollPtoEntry.create!(company:, employment:, consultant_pto_policy: advance.consultant_pto_policy, actor: owner,
          period: Date.new(2026, 12, 1), case_key: "review:#{advance.id}:advance", kind: "review_unpaid", origin_entry: advance,
          origin_component: "advance", minutes: advance.debt_minutes, balance_delta_minutes: advance.debt_minutes,
          cash_amount_minor: 1, source_digest: advance.source_digest, reason: "Synthetic over-recovery injection", idempotency_key: "raw-over-recovery")
      end
    end.to raise_error(ActiveRecord::StatementInvalid, /recovered|remaining/)
  end

  it "takes the run lock before the group when reconciliation races preparation", :pto_concurrency do
    decision("defer")
    revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(consultants: [{ employment_id: employment.id, acknowledged: true }],
      cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "concurrency-revision")
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
    instruction = accepted_instruction(revision:)
    instruction.update!(credit_state: "credited", credited_minor: instruction.entitlement_minor, transaction_status: "sent")
    group = instruction.payroll_payment_group
    backend = Queue.new
    worker_thread = nil
    run.with_lock do
      worker_thread = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |connection|
          backend << connection.select_value("SELECT pg_backend_pid()")
          Payroll::MercuryReconciliation.new(PayrollRun.find(run.id)).send(:sync_group, PayrollPaymentInstruction.find(instruction.id), User.find(accounts.id))
        end
      end
      Timeout.timeout(5) do
        pid = backend.pop
        sleep 0.01 until PayrollRun.connection.select_value("SELECT pg_backend_pid() = ANY(pg_blocking_pids(#{Integer(pid)}))")
      end
      group.with_lock { expect(group.fully_credited_at).to be_nil }
    end
    Timeout.timeout(5) { worker_thread.value }
    expect(group.reload.fully_credited_at).to be_present
  ensure
    worker_thread&.join(5)
  end
end
