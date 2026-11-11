# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Consultant invoice committed races and SQL boundaries" do
  include_context "committed consultant invoice"

  def issue
    Payroll::ConsultantInvoiceIssue.new(PayrollRun.find(run.id), employment_id: employment.id).issue!
  end

  before do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
  end

  it "lets one concurrent worker render and returns the durable winner on later replay" do
    ready = Queue.new
    release = Queue.new
    renders = Queue.new
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render) do
      renders << true
      ready << true
      release.pop
      File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf"))
    end
    threads = 2.times.map do
      Thread.new { ApplicationRecord.connection_pool.with_connection { issue } }
    end
    Timeout.timeout(10) { ready.pop }
    release << true
    outcomes = Timeout.timeout(10) { threads.map(&:value) }
    expect(outcomes.count { |result| result.is_a?(PayrollConsultantInvoice) }).to be >= 1
    expect(renders.size).to eq(1)
    expect(PayrollConsultantInvoice.count).to eq(1)
    invoice = PayrollConsultantInvoice.sole
    expect(issue.id).to eq(invoice.id)
    expect(invoice.payroll_consultant_invoice_deliveries.count).to eq(1)
  ensure
    threads&.each { |thread| thread.kill if thread.alive? }
    threads&.each(&:join)
  end

  it "holds the employment lock through the actual invoice INSERT before withdrawal can commit" do
    consent = ConsultantInvoiceAuthorization.heads.find_by!(employment:)
    withdrawal = nil
    allow_any_instance_of(PayrollConsultantInvoice).to receive(:save!).and_wrap_original do |method, *arguments|
      ready = Queue.new
      withdrawal = Thread.new do
        ApplicationRecord.connection_pool.with_connection do |connection|
          ready << connection.select_value("SELECT pg_backend_pid()")
          Payroll::InvoiceAuthorization.new(Employment.find(employment.id), actor: User.find(worker.id)).record!(action: "withdraw",
            expected_event_id: consent.id.to_s, statement_digest: "", idempotency_key: "concurrent-withdrawal")
        end
      end
      Timeout.timeout(5) do
        pid = ready.pop
        sleep 0.01 until ApplicationRecord.connection.select_value("SELECT pg_backend_pid()=ANY(pg_blocking_pids(#{Integer(pid)}))")
      end
      method.call(*arguments)
    end
    invoice = issue
    expect(invoice).to be_a(PayrollConsultantInvoice)
    expect(Timeout.timeout(5) { withdrawal.value }[:status]).to eq("withdrawn")
    expect(invoice.authorization_id).to eq(consent.id)
    expect(Payroll::InvoiceAuthorization.new(employment).authorized?).to be(false)
    expect(issue.id).to eq(invoice.id)
  ensure
    withdrawal&.kill if withdrawal&.alive?
    withdrawal&.join
  end

  it "rejects duplicate settlement/issuer-number inserts and SQL mutation of issued facts" do
    invoice = issue
    duplicate_settlement = invoice.dup
    duplicate_settlement.number_digest = "b" * 64
    expect do
      ApplicationRecord.transaction(requires_new: true) { duplicate_settlement.save! }
    end.to raise_error(ActiveRecord::RecordNotUnique, /consultant_invoice_one_settlement/)
    duplicate_number = invoice.dup
    duplicate_number.payroll_run_id = run.id + 1
    expect do
      ApplicationRecord.transaction(requires_new: true) { duplicate_number.save!(validate: false) }
    end.to raise_error(ActiveRecord::RecordNotUnique, /consultant_invoice_issuer_number/)
    [{ snapshot: {} }, { pdf_blob_id: invoice.pdf_blob_id + 1 }, { issued_on: 1.day.ago.to_date }].each do |changes|
      expect do
        ApplicationRecord.transaction(requires_new: true) { PayrollConsultantInvoice.where(id: invoice.id).update_all(changes) }
      end.to raise_error(ActiveRecord::StatementInvalid, /immutable/)
    end
    expect do
      ApplicationRecord.transaction(requires_new: true) { PayrollConsultantInvoice.where(id: invoice.id).delete_all }
    end.to raise_error(ActiveRecord::StatementInvalid, /immutable/)
  end
end
