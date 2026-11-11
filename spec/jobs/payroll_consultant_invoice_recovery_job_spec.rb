# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Durable consultant invoice wakeups" do
  include_context "committed consultant invoice"

  before do
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render).and_return(File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")))
    clear_enqueued_jobs
  end

  it "keeps real credit committed when its after-commit enqueue fails" do
    prepare_consultant_invoice
    expect(PayrollConsultantInvoiceIssueJob).to receive(:perform_later).with(run.id, employment.id).and_raise(StandardError, "synthetic queue unavailable")
    leg = credited_invoice_leg
    expect(leg.payroll_payment_group.reload.fully_credited_at).to be_present
    expect(leg.reload.credited_minor).to eq(net_minor)
  end

  it "wakes issuance for a later reviewed preparation and never for rolled-back credit" do
    leg = credited_invoice_leg
    clear_enqueued_jobs
    expect { prepare_consultant_invoice }.to have_enqueued_job(PayrollConsultantInvoiceIssueJob).with(run.id, employment.id)
    group = leg.payroll_payment_group
    group.update!(fully_credited_at: nil)
    clear_enqueued_jobs
    ApplicationRecord.transaction do
      group.update!(fully_credited_at: Time.current)
      raise ActiveRecord::Rollback
    end
    expect(enqueued_jobs.select { |job| job[:job] == PayrollConsultantInvoiceIssueJob }).to be_empty
  end

  it "keeps the invoice and initial queued attempt if delivery enqueue fails" do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    expect(PayrollConsultantInvoiceDeliveryJob).to receive(:perform_later).and_raise(StandardError, "synthetic queue unavailable")
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    expect(invoice).to be_a(PayrollConsultantInvoice)
    expect(invoice.payroll_consultant_invoice_deliveries.sole.state).to eq("queued")
  end

  it "recovers at most100 combined records and rotates blocked rows behind untouched due work" do
    receipt = prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    invoice.payroll_consultant_invoice_deliveries.sole.update!(updated_at: 2.hours.ago)
    101.times do |index|
      PayrollInvoicePreparation.create!(company:, payroll_run: run, payroll_revision: revision,
        employment: create(:employment, company:), actor: accounts, facts: receipt.facts, reviewed: true,
        idempotency_key: "recovery-#{index}", command_digest: "a" * 64, state: "blocked", next_attempt_at: 1.hour.ago)
    end
    clear_enqueued_jobs
    PayrollConsultantInvoiceRecoveryJob.perform_now
    first = enqueued_jobs.select { |job| [PayrollConsultantInvoiceIssueJob, PayrollConsultantInvoiceDeliveryJob].include?(job[:job]) }
    expect(first.size).to eq(100)
    expect(first.count { |job| job[:job] == PayrollConsultantInvoiceDeliveryJob }).to eq(1)
    clear_enqueued_jobs
    PayrollConsultantInvoiceRecoveryJob.perform_now
    expect(enqueued_jobs.count { |job| job[:job] == PayrollConsultantInvoiceIssueJob }).to eq(2)
    expect(PayrollInvoicePreparation.where(state: "blocked").where("next_attempt_at > ?", Time.current).count).to eq(101)
  end

  it "never automatically retries uncertain or failed attempts" do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    attempt = invoice.payroll_consultant_invoice_deliveries.sole
    attempt.update!(state: "uncertain", updated_at: 1.hour.ago)
    clear_enqueued_jobs
    PayrollConsultantInvoiceRecoveryJob.perform_now
    expect(enqueued_jobs).to be_empty
    attempt.update!(state: "failed", updated_at: 1.hour.ago)
    PayrollConsultantInvoiceRecoveryJob.perform_now
    expect(enqueued_jobs).to be_empty
  end

  it "preserves a due preparation across recovery enqueue failure and rotates its next attempt" do
    receipt = prepare_consultant_invoice
    receipt.update!(next_attempt_at: 1.hour.ago)
    expect(PayrollConsultantInvoiceIssueJob).to receive(:perform_later).and_raise(StandardError, "Synthetic lost queue")
    PayrollConsultantInvoiceRecoveryJob.perform_now
    expect(receipt.reload.state).to eq("waiting_credit")
    expect(receipt.next_attempt_at).to be > Time.current
    expect(PayrollConsultantInvoice.count).to eq(0)
  end

  it "leaves state changes silent and permits the controller's explicit retry enqueue after commit" do
    receipt = prepare_consultant_invoice
    receipt.update!(state: "failed")
    clear_enqueued_jobs
    receipt.update!(state: "queued", next_attempt_at: Time.current)
    expect(enqueued_jobs).to be_empty
    expect { PayrollConsultantInvoiceIssueJob.enqueue_safely(run.id, employment.id) }.to have_enqueued_job(PayrollConsultantInvoiceIssueJob).with(run.id, employment.id)
    clear_enqueued_jobs
    receipt.update!(state: "generating", claim_token: "synthetic-claim", started_at: Time.current)
    receipt.update!(state: "completed", claim_token: nil)
    expect(enqueued_jobs).to be_empty
  end

  it "recovers stale generation but leaves live, failed and completed claims alone" do
    receipt = prepare_consultant_invoice
    receipt.update!(state: "generating", started_at: 20.minutes.ago, next_attempt_at: 1.hour.ago)
    clear_enqueued_jobs
    expect { PayrollConsultantInvoiceRecoveryJob.perform_now }.to have_enqueued_job(PayrollConsultantInvoiceIssueJob).with(run.id, employment.id)
    clear_enqueued_jobs
    ["generating", "failed", "completed"].each do |state|
      receipt.update!(state:, started_at: Time.current, next_attempt_at: 1.hour.ago)
      PayrollConsultantInvoiceRecoveryJob.perform_now
      expect(enqueued_jobs).to be_empty
    end
  end

  it "recovers an interrupted sending claim to uncertainty without invoking transport" do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    attempt = invoice.payroll_consultant_invoice_deliveries.sole
    attempt.update!(state: "sending", started_at: 20.minutes.ago, updated_at: 20.minutes.ago, claim_token: "stale-worker")
    clear_enqueued_jobs
    expect { PayrollConsultantInvoiceRecoveryJob.perform_now }.to have_enqueued_job(PayrollConsultantInvoiceDeliveryJob).with(attempt.id)
    expect(attempt.reload).to have_attributes(state: "uncertain", error_code: "interrupted", claim_token: nil)
    expect(ActionMailer::Base.deliveries).to be_empty
    perform_enqueued_jobs(only: PayrollConsultantInvoiceDeliveryJob)
    expect(attempt.reload.state).to eq("uncertain")
    expect(ActionMailer::Base.deliveries).to be_empty
    clear_enqueued_jobs
    PayrollConsultantInvoiceRecoveryJob.perform_now
    expect(enqueued_jobs).to be_empty
  end
end
