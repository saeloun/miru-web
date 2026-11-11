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

  def after_render(&change)
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render).and_wrap_original do |method|
      bytes = method.call
      expect(ApplicationRecord.connection.transaction_open?).to be(false)
      change.call
      bytes
    end
  end

  it "rejects a preparation superseded through a fresh review during rendering and cleans its staged PDF" do
    prior = PayrollInvoicePreparation.sole
    blobs = ActiveStorage::Blob.count
    replacement = nil
    after_render do
      replacement = Payroll::ConsultantInvoicePreparation.new(run, actor: accounts).record!(employment_id: employment.id,
        facts: invoice_facts.merge("number" => "2"), expected_revision_digest: revision.digest,
        expected_preparation_id: prior.id.to_s, idempotency_key: "supersede-rendering")
    end
    expect(issue.id).to eq(prior.id)
    expect(prior.reload.error_code).to eq("preparation_changed")
    expect(PayrollInvoicePreparation.heads.sole.id).to eq(replacement.id)
    expect(replacement.reload.state).to eq("waiting_credit")
    expect(PayrollConsultantInvoice.count).to eq(0)
    expect(ActiveStorage::Blob.count).to eq(blobs)
  end

  it "does not clear a replacement operational claim when the rendering worker loses its token" do
    preparation = PayrollInvoicePreparation.sole
    blobs = ActiveStorage::Blob.count
    token = SecureRandom.hex(32)
    after_render do
      preparation.reload
      expect(PayrollInvoicePreparation.where(id: preparation.id, claim_token: preparation.claim_token)
        .update_all(claim_token: token, started_at: Time.current)).to eq(1)
    end
    expect(issue.id).to eq(preparation.id)
    expect(preparation.reload).to have_attributes(state: "generating", claim_token: token, error_code: nil)
    expect(PayrollConsultantInvoice.count).to eq(0)
    expect(ActiveStorage::Blob.count).to eq(blobs)
  end

  it "returns a newer stale-claim winner without replacing its PDF or duplicating delivery" do
    blobs = ActiveStorage::Blob.count
    winner = nil
    renders = 0
    after_render do
      renders += 1
      if renders == 1
        travel 16.minutes
        winner = issue
      end
    end
    result = issue
    expect(winner).to be_a(PayrollConsultantInvoice)
    expect(result.id).to eq(winner.id)
    expect(result.pdf_blob_id).to eq(winner.pdf_blob_id)
    expect(renders).to eq(2)
    expect(PayrollConsultantInvoice.count).to eq(1)
    expect(winner.payroll_consultant_invoice_deliveries.count).to eq(1)
    expect(ActiveStorage::Blob.count).to eq(blobs + 1)
  end

  it "keeps an intact credited revision as the source when a new payroll draft appears during rendering" do
    approved = revision
    draft = nil
    after_render do
      draft = workflow.revise!(actor: accounts, payload: approved.payroll_payload.deep_dup,
        expected_digest: approved.digest, idempotency_key: "draft-during-render")
    end
    invoice = issue
    expect(draft.payroll_approvals.count).to eq(0)
    expect(run.current_revision.id).to eq(draft.id)
    expect(invoice).to be_a(PayrollConsultantInvoice)
    expect(invoice.payroll_revision_id).to eq(approved.id)
    expect(invoice.snapshot.fetch("amounts")).to eq(approved.payroll_payload.fetch("lines").sole.fetch("amounts"))
  end

  it "blocks a subject discarded during rendering without deleting its real credit" do
    preparation = PayrollInvoicePreparation.sole
    group = PayrollPaymentGroup.sole
    blobs = ActiveStorage::Blob.count
    after_render { employment.discard! }
    expect(issue.id).to eq(preparation.id)
    expect(preparation.reload.error_code).to eq("subject_unavailable")
    expect(group.reload).to be_fully_credited
    expect(PayrollConsultantInvoice.count).to eq(0)
    expect(ActiveStorage::Blob.count).to eq(blobs)
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
