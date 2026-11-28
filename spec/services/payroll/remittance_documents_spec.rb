# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Private bank-issued remittance evidence" do
  include_context "committed consultant invoice"
  let(:leg) { credited_invoice_leg }
  let(:service) { Payroll::RemittanceDocuments.new(leg, actor: worker) }
  before { worker.update!(current_workspace: company) }

  def remittance_upload
    fixture = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    ActionDispatch::Http::UploadedFile.new(tempfile: fixture.tempfile, filename: "bank-advice.pdf", type: "application/pdf")
  end

  def record_document(**options)
    service.record!(kind: "firc", reason: "Declared bank-issued synthetic evidence", expected_document_id: "",
      idempotency_key: "first-evidence", file: remittance_upload, **options)
  end

  it "stores a private bank document before invoice issuance without changing confirmed credit" do
    payment = leg.reload.attributes
    expect(service.summary).to include(status: "missing", follow_up_required: true, credit_state: "credited", payment_state: "credited")
    record = record_document
    expect(service.summary).to include(status: "received", follow_up_required: false, invoice_id: nil)
    expect(record.company_id).to eq(company.id)
    expect(record.blob.service.public?).to be(false)
    expect(service.download(record.id).first).to eq(File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")))
    expect(leg.reload.attributes).to eq(payment)
    expect(PayrollConsultantInvoice.count).to eq(0)
  end

  it "deduplicates identical commands and retains immutable correction history" do
    first = record_document
    expect(record_document.id).to eq(first.id)
    expect { record_document(reason: "Changed command") }.to raise_error(Payroll::Workflow::Conflict)
    correction = record_document(reason: "Corrected bank evidence", expected_document_id: first.id.to_s, idempotency_key: "correction")
    expect(correction.previous_document_id).to eq(first.id)
    expect(service.summary.fetch(:documents).pluck(:id)).to contain_exactly(first.id.to_s, correction.id.to_s)
    expect { PayrollRemittanceDocument.where(id: first.id).update_all(document_kind: "fira") }.to raise_error(ActiveRecord::StatementInvalid)
    expect { PayrollRemittanceDocument.where(id: first.id).delete_all }.to raise_error(ActiveRecord::StatementInvalid)
    expect(ActiveStorage::Blob.where(id: [first.blob_id, correction.blob_id]).count).to eq(2)
  end

  it "rechecks role and workspace after upload and removes only the unused staged blob" do
    leg
    count = ActiveStorage::Blob.count
    domain = Payroll::RemittanceDocuments.new(leg, actor: accounts)
    allow(ActiveStorage::Blob).to receive(:build_after_unfurling).and_wrap_original do |method, **args|
      accounts.remove_role(:book_keeper, company)
      method.call(**args)
    end
    expect { domain.record!(kind: "firc", reason: "Synthetic bank evidence", expected_document_id: "", idempotency_key: "revoked", file: remittance_upload) }
      .to raise_error(Payroll::Workflow::NotAuthorized)
    expect(PayrollRemittanceDocument.count).to eq(0)
    expect(ActiveStorage::Blob.count).to eq(count)
  end

  it "rejects unsafe types and detects changed stored bytes without losing the receipt" do
    upload = remittance_upload
    upload.tempfile.truncate(0)
    upload.tempfile.write("<html>not bank evidence</html>")
    upload.tempfile.flush
    expect { record_document(file: upload) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    record = record_document
    record.blob.service.upload(record.blob.key, StringIO.new("corrupted"))
    expect { service.download(record.id) }.to raise_error(Payroll::Workflow::Conflict)
    expect(PayrollRemittanceDocument.exists?(record.id)).to be(true)
  end

  it "binds an earlier document to the later invoice without rewriting its retained bytes" do
    record = record_document
    before = record.attributes
    prepare_consultant_invoice
    grant_invoice_consent
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    expect(service.summary.fetch(:invoice_id)).to eq(invoice.id.to_s)
    expect(record.reload.attributes).to eq(before)
  end

  it "does not mark a split sibling received or require bank credit before receiving evidence" do
    revision
    arrangements = Payroll::SplitArrangements.new(run)
    spouse = bank_details.merge("bank_account_name" => "Synthetic Spouse", "bank_account_number" => "222233334444")
    arrangement = arrangements.request!(actor: accounts, employment_id: employment.id,
      attributes: { allocation_kind: "percentage", allocation_value: "25", allocated_to: "spouse", remainder_to: "consultant" },
      details: spouse, account_number_confirmation: spouse.fetch("bank_account_number"))
    arrangements.verify!(actor: accounts, arrangement_id: arrangement.id)
    arrangements.approve!(actor: owner, arrangement_id: arrangement.id)
    verified_connection
    linked_recipient
    spouse_id = "66666666-6666-4666-8666-666666666666"
    stub_mercury_reads
    stub_request(:get, "#{mercury_base}/recipient/#{spouse_id}").to_return(mercury_json(mercury_recipient("id" => spouse_id, "name" => "Synthetic Spouse",
      "internationalWireRoutingInfo" => { "iban" => "222233334444", "swiftCode" => bank_details.fetch("bank_swift"), "countrySpecific" => { "india" => { "ifscCode" => bank_details.fetch("bank_ifsc") } } })))
    linked_recipient(beneficiary: "spouse", id: spouse_id)
    first, sibling = Payroll::MercuryPayment.new(run).prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
    stub_mercury_write(mercury_json(mercury_request("status" => "approved", "amount" => first.principal_minor / 100.0)))
    Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: first.id, expected_digest: first.frozen_digest)
    domain = Payroll::RemittanceDocuments.new(first, actor: worker)
    expect(domain.summary).to include(status: "missing", follow_up_required: false, credit_state: "none",
      payment_state: "bank_approved_awaiting_transaction")
    domain.record!(kind: "fira", reason: "Synthetic bank evidence before credit", expected_document_id: "", idempotency_key: "split-document", file: remittance_upload)
    expect(first.reload.credit_state).to eq("none")
    expect(domain.summary).to include(status: "received", follow_up_required: false, credit_state: "none")
    expect(Payroll::RemittanceDocuments.new(sibling, actor: worker).summary).to include(status: "missing", follow_up_required: false,
      credit_state: "none", payment_state: "ready_for_submission")
  end

  it "requires missing-document follow-up after partial credit and an accepted shortfall" do
    instruction = prepared_instruction(revision:)
    stub_mercury_reads
    stub_mercury_write(mercury_json(mercury_request("status" => "approved", "amount" => instruction.principal_minor / 100.0)))
    Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
    instruction.update!(transaction_status: "sent", transaction_link_state: "linked", provider_transaction_id: SecureRandom.uuid)
    reconciliation = Payroll::MercuryReconciliation.new(run)
    reconciliation.record_credit!(actor: accounts, instruction_id: instruction.id, amount: "1.00", credited_on: "2026-12-05", reference: "Synthetic partial credit")
    domain = Payroll::RemittanceDocuments.new(instruction, actor: worker)
    expect(domain.summary).to include(status: "missing", follow_up_required: true, credit_state: "partial", payment_state: "partially_credited")

    reconciliation.resolve_shortfall!(actor: accounts, instruction_id: instruction.id, reason: "Synthetic receiving bank fee accepted")
    expect(domain.summary).to include(status: "missing", follow_up_required: true, credit_state: "shortfall_resolved", payment_state: "credited_shortfall_resolved")
  end

  it "does not require bank-document follow-up for a returned wire with retained credit history" do
    leg
    stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}")
      .to_return(mercury_json(mercury_request("status" => "approved", "amount" => leg.principal_minor / 100.0)))
    transaction = mercury_transaction("id" => leg.provider_transaction_id, "amount" => -leg.principal_minor / 100.0, "status" => "reversed")
    stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions})
      .to_return(mercury_json({ "total" => 1, "transactions" => [transaction] }))
    Payroll::MercuryReconciliation.new(run).refresh!(actor: owner, instruction_id: leg.id)

    expect(service.summary).to include(status: "missing", follow_up_required: false, credit_state: "credited", payment_state: "returned")
  end

  it "reports unavailable uploads safely and removes the unused staged blob" do
    leg
    count = ActiveStorage::Blob.count
    allow_any_instance_of(ActiveStorage::Blob).to receive(:upload_without_unfurling).and_raise(IOError, "Synthetic private storage detail")

    expect { record_document }.to raise_error(Payroll::Workflow::Conflict, "Remittance evidence upload is unavailable") do |error|
      expect(error.cause).to be_nil
    end
    expect(PayrollRemittanceDocument.count).to eq(0)
    expect(ActiveStorage::Blob.count).to eq(count)
  end

  it "preserves the safe upload conflict when storage upload and deletion both fail" do
    leg
    storage = ActiveStorage::Blob.service
    allow(storage).to receive(:upload).and_raise(IOError, "Synthetic private PUT detail")
    allow(storage).to receive(:delete).and_raise(IOError, "Synthetic private DELETE detail")
    expect(Rails.logger).to receive(:warn).with("Remittance evidence cleanup requires review")

    expect { record_document }.to raise_error(Payroll::Workflow::Conflict, "Remittance evidence upload is unavailable") do |error|
      expect(error.cause).to be_nil
    end
    expect(PayrollRemittanceDocument.count).to eq(0)
  end

  it "returns the committed replay and retains its file when unused staged deletion fails" do
    leg
    staged = retained = nil
    storage = ActiveStorage::Blob.service
    allow(service).to receive(:upload).and_wrap_original do |method, *arguments|
      staged = method.call(*arguments)
      retained = Payroll::RemittanceDocuments.new(leg, actor: worker).record!(kind: "firc", reason: "Declared bank-issued synthetic evidence",
        expected_document_id: "", idempotency_key: "first-evidence", file: remittance_upload)
      allow(storage).to receive(:delete).and_raise(IOError, "Synthetic private DELETE detail")
      staged
    end
    expect(Rails.logger).to receive(:warn).with("Remittance evidence cleanup requires review")

    expect(record_document.id).to eq(retained.id)
    expect(PayrollRemittanceDocument.count).to eq(1)
    expect(service.download(retained.id).first).to eq(File.binread(Rails.root.join("spec/support/fixtures/pdf-file.pdf")))
    expect(storage.exist?(staged.key)).to be(true)
  ensure
    if staged && !PayrollRemittanceDocument.exists?(blob_id: staged.id)
      allow(storage).to receive(:delete).and_call_original
      staged.purge
    end
  end

  it "rejects discarded subjects and changed upload bytes before retaining a receipt" do
    leg
    count = ActiveStorage::Blob.count
    allow(Payroll::BillingEvidence).to receive(:file_descriptor).and_wrap_original do |method, upload|
      descriptor = method.call(upload)
      upload.tempfile.write("changed")
      upload.tempfile.flush
      descriptor
    end
    expect { record_document }.to raise_error(Payroll::Workflow::Conflict)
    expect(ActiveStorage::Blob.count).to eq(count)
    employment.discard!
    expect { service.summary }.to raise_error(Payroll::Workflow::NotAuthorized)
  end

  it "rejects oversize files and unsupported document declarations" do
    upload = remittance_upload
    upload.tempfile.truncate(5.megabytes + 1)
    expect { record_document(file: upload) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    expect { record_document(kind: "mercury_receipt") }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    expect(PayrollRemittanceDocument.count).to eq(0)
  end

  it "deduplicates real concurrent final inserts and purges the losing staged upload" do
    leg.reload
    count = ActiveStorage::Blob.count
    waiting, release = Queue.new, Queue.new
    domains = 2.times.map { Payroll::RemittanceDocuments.new(PayrollPaymentInstruction.find(leg.id), actor: worker) }
    domains.each do |domain|
      allow(domain).to receive(:upload).and_wrap_original do |method, *args|
        blob = method.call(*args)
        waiting << true
        Timeout.timeout(10) { release.pop }
        blob
      end
    end
    threads = domains.map do |domain|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          domain.record!(kind: "firc", reason: "Concurrent synthetic upload", expected_document_id: "", idempotency_key: "racing-command", file: remittance_upload)
        end
      end
    end
    2.times { Timeout.timeout(10) { waiting.pop } }
    2.times { release << true }
    records = threads.map { |thread| Timeout.timeout(10) { thread.value } }
    expect(records.map(&:id).uniq.size).to eq(1)
    expect(PayrollRemittanceDocument.count).to eq(1)
    expect(ActiveStorage::Blob.count).to eq(count + 1)
  ensure
    2.times { release << true } if release
    threads&.each { |thread| thread.join(1); thread.kill if thread.alive? }
  end

  it "enforces tenant, correction and immutable SQL guards after schema reload" do
    record = record_document
    expect(ActiveRecord::Base.connection.select_value("SELECT count(*) FROM pg_trigger WHERE tgname='remittance_document_identity'").to_i).to eq(1)
    other_company = create(:company)
    copy = record.dup
    copy.company_id = other_company.id
    copy.idempotency_key = "cross-tenant-insert"
    expect { copy.save!(validate: false) }.to raise_error(ActiveRecord::StatementInvalid, /identity mismatch/)
    copy = record.dup
    copy.previous_document = record
    copy.document_kind = "fira"
    copy.idempotency_key = "cross-kind-correction"
    expect { copy.save!(validate: false) }.to raise_error(ActiveRecord::StatementInvalid, /correction identity/)
    expect(record.reload.details.fetch("reason")).to eq("Declared bank-issued synthetic evidence")
    cipher = ActiveRecord::Base.connection.select_value("SELECT details FROM payroll_remittance_documents WHERE id=#{record.id}")
    expect(cipher).not_to include("Declared bank-issued synthetic evidence", "%PDF")
  end
end
