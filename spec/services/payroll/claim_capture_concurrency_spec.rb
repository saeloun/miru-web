# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Payroll claim capture concurrency" do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
  end

  include_context "approved mercury consultant payroll"

  around do |example|
    travel_to(Time.utc(2026, 12, 5, 12)) { example.run }
  end

  it "rejects a claim edited and reapproved after cutoff between eligibility and revision capture" do
    employment.update!(joined_at: Date.new(2020, 1, 1))
    company.update!(timezone: "Asia/Kolkata")
    configure_synthetic_pto_policy
    record_synthetic_pto_treatment
    travel_to(Time.utc(2026, 11, 20, 12))
    claim = create(:expense, company:, user: worker, amount: 5_000, currency: "INR", date: Date.new(2026, 11, 2), status: :approved)
    travel_to(Time.utc(2026, 12, 5, 12))
    builder = Payroll::ConsultantRevision.new(run, actor: accounts)
    checked, resume = Queue.new, Queue.new
    allow(builder).to receive(:review_for).and_wrap_original do |original, *arguments|
      review = original.call(*arguments)
      checked << review.fetch(:selected_expense_ids)
      Timeout.timeout(10) { resume.pop }
      review
    end

    capture = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do
        revision = builder.create!(consultants: [{ employment_id: employment.id, expense_ids: [claim.id], acknowledged: true }],
          cutoff: "2026-11-30", expected_digest: nil, idempotency_key: "claim-capture-race")
        workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
        workflow.approve!(actor: owner, stage: "final", expected_digest: revision.digest)
        { result: :approved, reimbursement_minor: revision.payroll_payload.fetch("lines").first.dig("amounts", "reimbursements_minor"),
          status: workflow.status }
      rescue Payroll::ConsultantReview::InvalidInput, Payroll::Workflow::Conflict, Payroll::MercuryPayment::Blocked => error
        { result: :blocked, error: error.class.name }
      end
    end

    expect(Timeout.timeout(10) { checked.pop }).to eq([claim.id])
    claim.update!(amount: 6_000)
    claim.approve!
    expect(claim.approved_at).to be > company.resolved_time_zone.local(2026, 11, 30).end_of_day
    resume << true
    result = Timeout.timeout(10) { capture.value }

    expect(result).to include(result: :blocked)
    expect(run.payroll_revisions.count).to eq(0)
    expect(PayrollExpenseReservation.active.where(expense: claim)).to be_empty
  ensure
    resume << true if resume
    capture&.join(5) || capture&.kill&.join
  end
end
