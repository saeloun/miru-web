# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Payroll claim settlement concurrency" do
  before do
    # These races must observe commits from separate database connections.
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
    expect(ActiveRecord::Base.connection.open_transactions).to eq(0)
  end

  include_context "approved mercury consultant payroll"

  let(:claim) do
    create(:expense, company:, user: worker, amount: 5_000, currency: "INR", date: Date.new(2026, 11, 2), status: :approved)
  end

  before { employment.update!(joined_at: Date.new(2020, 1, 1)) }

  around do |example|
    travel_to(Time.utc(2027, 1, 5, 12)) { example.run }
  end

  def prepare_claim(payroll_run)
    revision = Payroll::ConsultantRevision.new(payroll_run, actor: accounts).create!(
      consultants: [{ employment_id: employment.id, expense_ids: [claim.id], acknowledged: true }],
      cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "claim-#{payroll_run.id}")
    Payroll::Workflow.new(payroll_run).approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    revision
  end

  it "atomically reserves a claim for one run when two payroll approvals select it concurrently" do
    later = PayrollRun.create!(company:, period: Date.new(2026, 12, 1), currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
    create(:timesheet_entry, user: worker, project: work_entry.project, work_date: Date.new(2026, 12, 2), duration: 480)
    revisions = [prepare_claim(run), prepare_claim(later)]
    ready = Queue.new
    allow(Payroll::ClaimReference).to receive(:reserve_entry!).and_wrap_original do |original, *arguments|
      ready << arguments.first.id if Payroll::ClaimReference.expense_id(arguments.last["source_reference"]) == claim.id
      original.call(*arguments)
    end

    approvals = []
    claim.with_lock do
      revisions.each do |revision|
        approvals << Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            Payroll::Workflow.new(PayrollRun.find(revision.payroll_run_id)).approve!(
              actor: User.find(owner.id), stage: "final", expected_digest: revision.digest)
            [:approved, revision.id]
          rescue Payroll::Workflow::Conflict => error
            [:blocked, revision.id, error.message]
          end
        end
      end
      expect(Timeout.timeout(10) { 2.times.map { ready.pop } }).to match_array([run.id, later.id])
    end

    results = Timeout.timeout(10) { approvals.map(&:value) }
    expect(results.map(&:first).tally).to eq(approved: 1, blocked: 1)
    expect(results.assoc(:blocked).last).to include("reserved by another payroll")
    winner = revisions.find { |revision| revision.id == results.assoc(:approved)[1] }
    reservation = PayrollExpenseReservation.active.where(expense: claim).sole
    expect(reservation).to have_attributes(payroll_run_id: winner.payroll_run_id, payroll_revision_id: winner.id, amount_minor: 500_000)
    expect(PayrollApproval.where(payroll_revision: revisions, stage: "final").pluck(:payroll_revision_id)).to eq([winner.id])
    expect(claim.reload).to have_attributes(status: "approved", paid_at: nil)
  ensure
    approvals&.each { |approval| approval.join(5) || approval.kill.join }
  end

  it "prevents direct expense settlement from paying a claim reserved by an approved payroll run" do
    revision = prepare_claim(run)
    ready = Queue.new
    settlement = nil
    claim.with_lock do
      workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
      settlement = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          expense = Expense.find(claim.id)
          ready << ExpensePolicy.new(User.find(owner.id), expense).mark_paid?
          expense.mark_paid!
          [:paid]
        rescue ActiveRecord::RecordInvalid => error
          [:blocked, error.message]
        end
      end
      expect(Timeout.timeout(10) { ready.pop }).to be(true)
    end

    result = Timeout.timeout(10) { settlement.value }
    expect(result.first).to eq(:blocked)
    expect(result.last).to include("reserved by a payroll run")
    expect(claim.reload).to have_attributes(status: "approved", paid_at: nil)
    expect(PayrollExpenseReservation.active.where(expense: claim).sole.settled_at).to be_nil
    expect(revision.payroll_approvals.where(stage: "final").count).to eq(1)
  ensure
    settlement&.join(5) || settlement&.kill&.join
  end

  it "rejects payroll reservation when direct settlement wins after payroll validation" do
    revision = prepare_claim(run)
    ready = Queue.new
    allow(Payroll::ClaimReference).to receive(:reserve_entry!).and_wrap_original do |original, *arguments|
      ready << true if Payroll::ClaimReference.expense_id(arguments.last["source_reference"]) == claim.id
      original.call(*arguments)
    end

    approval = nil
    claim.with_lock do
      approval = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          Payroll::Workflow.new(PayrollRun.find(run.id)).approve!(actor: User.find(owner.id), stage: "final", expected_digest: revision.digest)
          [:approved]
        rescue Payroll::Workflow::Conflict => error
          [:blocked, error.message]
        end
      end
      Timeout.timeout(10) { ready.pop }
      claim.mark_paid!
    end

    result = Timeout.timeout(10) { approval.value }
    expect(result.first).to eq(:blocked)
    expect(result.last).to include("no longer payable")
    expect(claim.reload).to be_paid
    expect(claim.paid_at).to be_present
    expect(PayrollExpenseReservation.active.where(expense: claim)).to be_empty
    expect(revision.payroll_approvals.where(stage: "final")).to be_empty
  ensure
    approval&.join(5) || approval&.kill&.join
  end
end
