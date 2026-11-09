# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Billing identity and Workflow serialization" do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end
  include_context "reviewed mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  def workflow_holds_identity_lock(&operation)
    binding = Payroll::BillingIdentity.new(employment).binding
    locked, release, reviewer_ready = Queue.new, Queue.new, Queue.new
    queries = []
    workflow_thread = reviewer_thread = nil
    subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |event|
      next unless Thread.current == workflow_thread
      sql = event.payload.fetch(:sql)
      next unless sql.include?("FOR UPDATE")

      queries << sql
      next unless sql.include?('"employments"') && sql.include?('ORDER BY "employments"."id" ASC')

      locked << true
      release.pop
    end
    start, workflow_ready = Queue.new, Queue.new
    workflow_thread = Thread.new do
      ApplicationRecord.connection_pool.with_connection do |connection|
        workflow_ready << connection.select_value("SELECT pg_backend_pid()")
        start.pop
        operation.call
      end
    end
    workflow_pid = Timeout.timeout(5) { workflow_ready.pop }
    start << true
    Timeout.timeout(5) { locked.pop }
    reviewer_thread = Thread.new do
      ApplicationRecord.connection_pool.with_connection do |connection|
        reviewer_ready << connection.select_value("SELECT pg_backend_pid()")
        Payroll::BillingIdentity.new(Employment.find(employment.id), actor: User.find(owner.id)).review!(
          submission_id: binding.fetch("submission_id"), expected_review_id: binding.fetch("review_id"), decision: "rejected",
          reason: "Synthetic billing correction", manual_tax_reviewed: false, missing_pan_acknowledged: false, idempotency_key: "workflow-revocation")
      end
    end
    reviewer_pid = Timeout.timeout(5) { reviewer_ready.pop }
    Timeout.timeout(5) do
      loop do
        blocked = ApplicationRecord.connection.select_value(<<~SQL)
          SELECT wait_event_type='Lock' AND #{Integer(workflow_pid)}=ANY(pg_blocking_pids(pid))
          FROM pg_stat_activity WHERE pid=#{Integer(reviewer_pid)}
        SQL
        break if blocked
        sleep 0.01
      end
    end
    expect(Payroll::BillingIdentity.new(employment).valid_binding?(binding)).to be(true)
    expect(queries.index { |sql| sql.include?('"payroll_runs"') }).to be < queries.index { |sql| sql.include?('"employments"') }
    release << true
    result = Timeout.timeout(10) { workflow_thread.value }
    expect(Timeout.timeout(10) { reviewer_thread.value }[:status]).to eq("rejected")
    expect(Payroll::BillingIdentity.new(employment).binding).to be_nil
    expect(Payroll::Workflow.new(run.reload).status).to eq("draft")
    expect(PayrollPaymentInstruction.count).to eq(0)
    result
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
    [workflow_thread, reviewer_thread].compact.each { |thread| thread.kill if thread.alive? }
    [workflow_thread, reviewer_thread].compact.each(&:join)
  end

  it "holds the ordered employment lock through real revision creation before review revocation" do
    payload = synthetic_payload
    revision = workflow_holds_identity_lock do
      Payroll::Workflow.new(PayrollRun.find(run.id)).revise!(actor: User.find(accounts.id), payload:, idempotency_key: "locked-revision", expected_digest: nil)
    end
    expect(revision).to be_persisted
    expect(run.current_revision.id).to eq(revision.id)
  end

  it "holds the ordered employment lock through real final approval before review revocation" do
    revision = workflow.revise!(actor: accounts, payload: synthetic_payload, idempotency_key: "draft", expected_digest: nil)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: revision.digest)
    approval = workflow_holds_identity_lock do
      Payroll::Workflow.new(PayrollRun.find(run.id)).approve!(actor: User.find(owner.id), stage: "final", expected_digest: revision.digest)
    end
    expect(approval).to be_persisted
    expect(revision.payroll_approvals.pluck(:stage)).to match_array(%w[accounts final])
  end
end
