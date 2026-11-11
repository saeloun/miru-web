# frozen_string_literal: true

require "rails_helper"

RSpec.describe Payroll::ConsultantInvoiceDelivery do
  include_context "committed consultant invoice"
  let(:pdf_bytes) { File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")) }
  let(:invoice) do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
  end
  let(:attempt) { invoice.payroll_consultant_invoice_deliveries.sole }

  before do
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render).and_return(pdf_bytes)
    ActionMailer::Base.deliveries.clear
    clear_enqueued_jobs
  end

  it "commits the claim before transport and duplicate jobs send identical frozen PDF bytes once" do
    id = attempt.id
    seen = []
    allow(PayrollConsultantInvoiceMailer).to receive(:invoice).and_wrap_original do |original, *args|
      original.call(*args).tap do |mail|
        allow(mail).to receive(:deliver_now).and_wrap_original do |send_mail|
          seen << [ApplicationRecord.connection.transaction_open?, PayrollConsultantInvoiceDelivery.find(id).state]
          described_class.new(PayrollConsultantInvoiceDelivery.find(id)).deliver
          send_mail.call
        end
      end
    end
    2.times { described_class.new(attempt).deliver }
    expect(seen).to eq([[false, "sending"]])
    expect(attempt.reload.state).to eq("sent")
    expect(ActionMailer::Base.deliveries.sole.to).to eq([invoice.snapshot.fetch("accounts_email")])
    expect(ActionMailer::Base.deliveries.sole.attachments.sole.decoded).to eq(pdf_bytes)
  end

  it "retains uncertain transport and requires stopped-worker reconciliation before a fresh authorized retry" do
    id = attempt.id
    allow(PayrollConsultantInvoiceMailer).to receive(:invoice).and_wrap_original do |original, *args|
      original.call(*args).tap { |mail| allow(mail).to receive(:deliver_now).and_raise(IOError, "synthetic acceptance uncertainty") }
    end
    described_class.new(attempt).deliver
    expect(attempt.reload).to have_attributes(state: "uncertain", error_code: "transport_unknown")
    expect { described_class.new(attempt).retry!(actor: owner, expected_attempt_id: id.to_s) }.to raise_error(Payroll::Workflow::Conflict)
    expect do
      described_class.new(attempt).reconcile!(actor: owner, outcome: "not_delivered", evidence: { reference: "Synthetic transport review", worker_stopped: false })
    end.to raise_error(Payroll::Workflow::Conflict)
    described_class.new(attempt).reconcile!(actor: owner, outcome: "not_delivered", evidence: { reference: "Synthetic stopped-worker review", worker_stopped: true })
    accounts.remove_role(:book_keeper, company)
    retried = described_class.new(attempt).retry!(actor: owner, expected_attempt_id: id.to_s)
    expect(retried).to have_attributes(attempt_number: 2, state: "queued", reviewed_by_id: owner.id)
    expect { described_class.new(attempt).retry!(actor: owner, expected_attempt_id: id.to_s) }.to raise_error(Payroll::Workflow::Conflict)
    expect(invoice.reload.pdf_blob.download).to eq(pdf_bytes)
    allow(PayrollConsultantInvoiceMailer).to receive(:invoice).and_call_original
    described_class.new(retried).deliver
    expect(retried.reload.state).to eq("sent")
    expect(ActionMailer::Base.deliveries.sole.attachments.sole.decoded).to eq(pdf_bytes)
  end

  it "verifies private frozen PDF bytes and reports current reopened credit separately" do
    expect(described_class.pdf_bytes(invoice, kind: :paid)).to eq(pdf_bytes)
    expect(described_class.credit_review?(invoice)).to be(false)
    invoice.payroll_payment_group.update!(fully_credited_at: nil)
    expect(described_class.credit_review?(invoice)).to be(true)
    expect(invoice.reload.snapshot.fetch("status")).to eq("Paid")
    expect(described_class.pdf_bytes(invoice, kind: :paid)).to eq(pdf_bytes)
  end

  it "preserves the retry authorizer separately from another reviewer's reconciliation" do
    attempt.update!(state: "failed", error_code: "attachment_unavailable")
    retried = described_class.new(attempt).retry!(actor: owner, expected_attempt_id: attempt.id)
    authorization = retried.attributes.slice("reviewed_by_id", "reviewed_at", "review_evidence")
    allow(PayrollConsultantInvoiceMailer).to receive(:invoice).and_wrap_original do |original, *args|
      original.call(*args).tap { |mail| allow(mail).to receive(:deliver_now).and_raise(IOError, "synthetic transport uncertainty") }
    end
    described_class.new(retried).deliver
    expect(retried.reload.state).to eq("uncertain")
    described_class.new(retried).reconcile!(actor: accounts, outcome: "not_delivered",
      evidence: { reference: "Synthetic independent stopped-worker review", worker_stopped: true })
    expect(retried.reload.attributes.slice(*authorization.keys)).to eq(authorization)
    expect(retried).to have_attributes(reconciled_by_id: accounts.id, reconciled_at: Time.current)
    expect(JSON.parse(retried.reconciliation_evidence)).to include("worker_stopped" => true)
    expect(retried.serializable_hash).not_to have_key("reconciliation_evidence")
    expect(retried.inspect).not_to include("Synthetic independent stopped-worker review")
    connection = ApplicationRecord.connection
    encrypted = connection.select_value("SELECT reconciliation_evidence FROM payroll_consultant_invoice_deliveries WHERE id = #{retried.id}")
    expect(encrypted).not_to include("Synthetic independent stopped-worker review")
    expect do
      connection.execute("UPDATE payroll_consultant_invoice_deliveries SET reconciled_by_id = #{owner.id} WHERE id = #{attempt.id}")
    end.to raise_error(ActiveRecord::StatementInvalid, /invoice_delivery_reconciliation_complete/)
    ["reviewed_by_id = #{accounts.id}", "reviewed_at = NULL", "review_evidence = NULL",
     "reconciled_by_id = #{owner.id}", "reconciled_at = NULL", "reconciliation_evidence = NULL"].each do |change|
      expect do
        connection.execute("UPDATE payroll_consultant_invoice_deliveries SET #{change} WHERE id = #{retried.id}")
      end.to raise_error(ActiveRecord::StatementInvalid, /review.*immutable/)
    end
  end

  it "expires a claim delayed during attachment building without starting transport" do
    id = attempt.id
    allow(PayrollConsultantInvoiceMailer).to receive(:invoice).and_wrap_original do |original, *args|
      original.call(*args).tap do |mail|
        mail.message
        travel 16.minutes
        expect(mail).not_to receive(:deliver_now)
      end
    end
    described_class.new(PayrollConsultantInvoiceDelivery.find(id)).deliver
    expect(attempt.reload).to have_attributes(state: "failed", error_code: "claim_expired", claim_token: nil)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "starts the transport clock at the final gate after ordinary attachment building" do
    id = attempt.id
    claimed_at = Time.current
    allow(PayrollConsultantInvoiceMailer).to receive(:invoice).and_wrap_original do |original, *args|
      original.call(*args).tap do |mail|
        mail.message
        travel 1.minute
        allow(mail).to receive(:deliver_now).and_wrap_original do |send_mail|
          expect(PayrollConsultantInvoiceDelivery.find(id).started_at).to eq(Time.current)
          send_mail.call
        end
      end
    end
    described_class.new(PayrollConsultantInvoiceDelivery.find(id)).deliver
    expect(attempt.reload).to have_attributes(state: "sent", started_at: claimed_at + 1.minute)
  end

  it "rejects absent confirmation or a changed frozen recipient without using today's alias" do
    confirmed = { "accounts_destination_confirmed" => true, "accounts_email" => "reviewed@example.test" }
    preparation = instance_double(PayrollInvoicePreparation, reviewed?: true, facts: confirmed)
    record = instance_double(PayrollConsultantInvoice, preparation:, snapshot: confirmed)
    stub_const("Payroll::ConsultantInvoicePreparation::ACCOUNTS_EMAIL", "new-alias@example.test")
    expect(described_class.recipient(record)).to eq("reviewed@example.test")
    [confirmed.except("accounts_destination_confirmed"), confirmed.merge("accounts_email" => "changed@example.test")].each do |snapshot|
      allow(record).to receive(:snapshot).and_return(snapshot)
      expect { described_class.recipient(record) }.to raise_error(Payroll::Workflow::Conflict)
    end
  end

  it "rejects a changed workspace immediately before transport" do
    id = attempt.id
    allow(PayrollConsultantInvoiceMailer).to receive(:invoice).and_wrap_original do |original, *args|
      original.call(*args).tap do |mail|
        mail.message
        accounts.update!(current_workspace: create(:company))
      end
    end
    described_class.new(PayrollConsultantInvoiceDelivery.find(id)).deliver
    expect(attempt.reload).to have_attributes(state: "failed", error_code: "source_review_required")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "rejects changed private PDF bytes before constructing a transport" do
    id = attempt.id
    invoice.pdf_blob.service.upload(invoice.pdf_blob.key, StringIO.new(pdf_bytes.sub("%PDF", "%BAD")))
    expect { described_class.pdf_bytes(invoice, kind: :paid) }.to raise_error(Payroll::Workflow::Conflict)
    described_class.new(PayrollConsultantInvoiceDelivery.find(id)).deliver
    expect(attempt.reload).to have_attributes(state: "failed", error_code: "attachment_unavailable")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "marks interrupted sending uncertain and rejects self or foreign-workspace reconciliation" do
    attempt.update!(state: "sending", started_at: 20.minutes.ago, claim_token: "old-claim")
    described_class.new(attempt).deliver
    expect(attempt.reload).to have_attributes(state: "uncertain", error_code: "interrupted", claim_token: nil)
    evidence = { reference: "Synthetic stopped-worker confirmation", worker_stopped: true }
    expect { described_class.new(attempt).reconcile!(actor: worker, outcome: "delivered", evidence:) }.to raise_error(Payroll::Workflow::NotAuthorized)
    owner.update!(current_workspace: create(:company))
    expect { described_class.new(attempt).reconcile!(actor: owner, outcome: "delivered", evidence:) }.to raise_error(Payroll::Workflow::NotAuthorized)
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "does not let a late transport overwrite an explicitly reconciled outcome" do
    id = attempt.id
    allow(PayrollConsultantInvoiceMailer).to receive(:invoice).and_wrap_original do |original, *args|
      original.call(*args).tap do |mail|
        allow(mail).to receive(:deliver_now) do
          PayrollConsultantInvoiceDelivery.find(id).update!(state: "uncertain")
          described_class.new(PayrollConsultantInvoiceDelivery.find(id)).reconcile!(actor: owner, outcome: "not_delivered",
            evidence: { reference: "Synthetic stopped worker", worker_stopped: true })
          raise IOError, "synthetic late transport outcome"
        end
      end
    end
    described_class.new(attempt).deliver
    expect(attempt.reload).to have_attributes(state: "failed", error_code: "delivery_confirmed_absent", claim_token: nil)
  end

  it "verifies an own unreviewed original before any invoice exists" do
    worker.update!(current_workspace: company)
    file = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    upload = ActionDispatch::Http::UploadedFile.new(tempfile: file.tempfile, filename: "original.pdf", type: "application/pdf")
    original_facts = invoice_facts.merge("mode" => "existing", "timing" => "existing_invoice", "original_date" => "2026-11-30", "accounts_destination_confirmed" => false)
    receipt = Payroll::ConsultantInvoicePreparation.new(run, actor: worker).record!(employment_id: employment.id, facts: original_facts,
      expected_revision_digest: revision.digest, expected_preparation_id: "", idempotency_key: "own-before-invoice", original_pdf: upload, reviewed: false)
    expect(PayrollConsultantInvoice.count).to eq(0)
    expect(described_class.preparation_original_bytes(receipt)).to eq(pdf_bytes)
  ensure
    upload&.close
  end
end
