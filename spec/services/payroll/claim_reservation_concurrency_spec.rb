# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Payroll claim reservation concurrency" do
  before do
    # Observe real commits across the approval and expense-edit connections.
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
  end

  include_context "approved mercury consultant payroll"

  around do |example|
    travel_to(Time.utc(2026, 12, 5, 12)) { example.run }
  end

  %w[edited reapproved].each do |change|
    it "rejects an expense #{change} after payroll validation but before reservation" do
      employment.update!(joined_at: Date.new(2020, 1, 1))
      configure_synthetic_pto_policy
      record_synthetic_pto_treatment
      claim = create(:expense, company:, user: worker, amount: 5_000, currency: "INR", date: Date.new(2026, 11, 2), status: :approved)
      revision = Payroll::ConsultantRevision.new(run, actor: accounts).create!(
        consultants: [{ employment_id: employment.id, expense_ids: [claim.id], acknowledged: true }],
        cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: change)
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
      ready = Queue.new
      allow(Payroll::ClaimReference).to receive(:reserve_entry!).and_wrap_original do |original, *arguments|
        ready << true
        original.call(*arguments)
      end

      approval = nil
      claim.with_lock do
        approval = Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            Payroll::Workflow.new(PayrollRun.find(run.id)).approve!(actor: User.find(owner.id), stage: "final", expected_digest: revision.digest)
            :approved
          rescue Payroll::Workflow::Conflict, ActiveRecord::RecordInvalid
            :blocked
          end
        end
        Timeout.timeout(10) { ready.pop }
        claim.update!(amount: 6_000)
        claim.approve! if change == "reapproved"
      end

      aggregate_failures do
        expect(approval.value).to eq(:blocked)
        expect(revision.payroll_approvals.where(stage: "final").count).to eq(0)
        expect(PayrollExpenseReservation.active.where(expense: claim).count).to eq(0)
      end
    ensure
      approval&.join(5)
    end
  end
end
