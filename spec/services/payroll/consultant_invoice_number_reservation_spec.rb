# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Consultant invoice issuer reservations" do
  include_context "committed consultant invoice"
  let(:invoice_funding) { "india" }

  def full_credit(target, subject, approved)
    details = Payroll::IndiaReport.bank_details(subject.reload)
    handoff = Payroll::IndiaHandoff.new(target).create!(actor: owner, employment_id: subject.id,
      expected_digest: approved.digest, accounts_email: "synthetic-accounts@example.test", bank_confirmed: true,
      expected_bank_digest: Payroll::MercurySetup.digest(details.sort.to_h))
    Payroll::IndiaDelivery.new(handoff.payroll_india_deliveries.sole).deliver
    Payroll::IndiaHandoff.new(target).record_credit!(actor: accounts, handoff_id: handoff.id,
      amount: (handoff.entitlement_minor.to_d / 100).to_s("F"), credited_on: Date.current.iso8601, reference: "Synthetic historical qualification #{handoff.id}")
    expect(handoff.reload.fully_credited_at).to be_present
  end

  def historical_subjects
    travel_to(Time.utc(2027, 1, 5, 12))
    first_revision = revision
    full_credit(run, employment, first_revision)
    employment.discard!
    extra = create(:employment, company:, user: worker, joined_at: Date.new(2020, 1, 1), resigned_at: nil)
    EmployeeRecord.create!(employment: extra, private_details: bank_details)
    terms = employment.consultant_compensations.last.dup
    terms.employment = extra
    terms.save!
    review_synthetic_billing_identity(employment: extra, reviewer: owner)
    configure_synthetic_pto_policy(employment: extra)
    next_run = PayrollRun.create!(company:, period: Date.new(2026, 12, 1), currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
    create(:timesheet_entry, user: worker, project: work_entry.project, work_date: Date.new(2026, 12, 2), duration: 480)
    record_synthetic_pto_treatment(employment: extra, period: next_run.period)
    second_revision = Payroll::ConsultantRevision.new(next_run, actor: accounts).create!(
      consultants: [{ employment_id: extra.id, expense_ids: [], acknowledged: true }], cutoff: "2026-12-31",
      expected_digest: nil, idempotency_key: "historical-second-revision")
    workflow = Payroll::Workflow.new(next_run)
    workflow.approve!(actor: accounts, stage: "accounts", expected_digest: second_revision.digest)
    workflow.approve!(actor: owner, stage: "final", expected_digest: second_revision.digest)
    full_credit(next_run, extra, second_revision)
    employment.undiscard!
    expect(company.employments.kept.where(user: worker).count).to eq(2)
    [extra, next_run, [first_revision, second_revision]]
  end

  it "serializes restored historical employments across runs and permits replacement of the winner's own head" do
    extra, next_run, approved = historical_subjects
    ready = Queue.new
    start = [Queue.new, Queue.new]
    inserting = Queue.new
    finish = Queue.new
    outcomes = Queue.new
    domains = [run, next_run].map { |target| Payroll::ConsultantInvoicePreparation.new(PayrollRun.find(target.id), actor: User.find(accounts.id)) }
    domains.each_with_index do |domain, index|
      allow(domain).to receive(:reserve_number!).and_wrap_original do |method, *arguments|
        ready << [index, ApplicationRecord.connection.select_value("SELECT pg_backend_pid()")]
        start[index].pop
        method.call(*arguments)
      end
    end
    allow_any_instance_of(PayrollInvoicePreparation).to receive(:save!).and_wrap_original do |method, *arguments|
      if method.receiver.payroll_run_id == run.id
        inserting << true
        finish.pop
      end
      method.call(*arguments)
    end
    threads = domains.each_with_index.map do |domain, index|
      Thread.new do
        ApplicationRecord.connection_pool.with_connection do
          result = domain.record!(employment_id: [employment.id, extra.id][index], facts: invoice_facts,
            expected_revision_digest: approved[index].digest, expected_preparation_id: "", idempotency_key: "concurrent-issuer")
          outcomes << result
        rescue Payroll::Workflow::Conflict => error
          outcomes << error
        end
      end
    end
    pids = Timeout.timeout(10) { 2.times.to_h { ready.pop } }
    start[0] << true
    Timeout.timeout(10) { inserting.pop }
    start[1] << true
    blocked = Timeout.timeout(10) do
      loop do
        waiting = ApplicationRecord.connection.select_value("SELECT #{Integer(pids[0])}=ANY(pg_blocking_pids(#{Integer(pids[1])}))")
        break true if waiting
        break false unless outcomes.empty?
        Thread.pass
      end
    end
    finish << true
    Timeout.timeout(10) { threads.each(&:value) }
    results = 2.times.map { outcomes.pop }
    aggregate_failures do
      expect(pids.values.uniq.size).to eq(2)
      expect(blocked).to be(true)
      expect(results.count { |result| result.is_a?(PayrollInvoicePreparation) }).to eq(1)
      expect(results.count { |result| result.is_a?(Payroll::Workflow::Conflict) }).to eq(1)
      expect(PayrollInvoicePreparation.count).to eq(1)
    end
    allow(domains[0]).to receive(:reserve_number!).and_call_original
    allow_any_instance_of(PayrollInvoicePreparation).to receive(:save!).and_call_original
    first = PayrollInvoicePreparation.sole
    replacement = domains[0].record!(employment_id: employment.id, facts: invoice_facts, expected_revision_digest: approved[0].digest,
      expected_preparation_id: first.id.to_s, idempotency_key: "replace-own-head")
    expect(replacement.previous_preparation_id).to eq(first.id)
  ensure
    threads&.each { |thread| thread.kill if thread.alive? }
    threads&.each(&:join)
  end
end
