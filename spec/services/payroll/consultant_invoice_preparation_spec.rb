# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant invoice preparation" do
  include_context "reviewed mercury consultant payroll"
  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }
  let!(:revision) { approve_revision }
  let(:service) { Payroll::ConsultantInvoicePreparation.new(run, actor: accounts) }
  let(:facts) do
    { "mode" => "generate", "billed_entity" => { "name" => legal_name, "address" => "1 Fictional Street, US", "country" => "US", "tax_identifier" => "", "tax_reason" => "Synthetic not applicable" },
      "document_kind" => "consultant_invoice", "treatment" => "manual_reviewed", "treatment_reason" => "Synthetic non-statutory review fixture",
      "timing" => "post_credit_supported", "financial_year" => "2026-2027", "series" => "SYN", "number" => "1",
      "existing_invoice_considered" => true, "accounts_destination_confirmed" => true, "tax_lines" => [] }
  end

  def prepare(input = facts, key: "preparation", previous: "")
    service.record!(expected_revision_digest: revision.digest, employment_id: employment.id, facts: input, expected_preparation_id: previous, idempotency_key: key)
  end

  it "records encrypted frozen facts, server-derived destination and exact approved source" do
    receipt = prepare
    expect(receipt).to be_reviewed
    expect(receipt.payroll_revision).to eq(revision)
    expect(receipt.facts).to include(facts)
    expect(receipt.accounts_email).to eq("accounts@saeloun.com")
    expect(receipt.facts.fetch("accounts_email")).to eq("accounts@saeloun.com")
    raw = PayrollInvoicePreparation.connection.select_value("SELECT facts FROM payroll_invoice_preparations WHERE id=#{receipt.id}")
    expect(raw).not_to include("Fictional Street")
    expect(receipt.serializable_hash).not_to have_key("facts")
    expect { receipt.update!(facts: {}) }.to raise_error(ActiveRecord::ReadOnlyRecord)
    receipt.reload
    receipt.update!(state: "queued")
    expect(receipt.reload.state).to eq("queued")
  end

  it "requires explicit mode, full entity and document/timing facts; recipients are not writable" do
    [facts.except("mode"), facts.merge("mode" => ""), facts.merge("billed_entity" => {}),
     facts.merge("timing" => "assume_export"), facts.merge("accounts_email" => "other@example.com"),
     facts.merge("invoice_date" => "2020-01-01"), facts.merge("existing_invoice_considered" => false)].each do |input|
      expect { prepare(input) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    end
    expect(PayrollInvoicePreparation.count).to eq(0)
  end

  it "requires an explicit reviewed accounts destination acknowledgement and rejects false or string confirmation" do
    [facts.except("accounts_destination_confirmed"), facts.merge("accounts_destination_confirmed" => false),
     facts.merge("accounts_destination_confirmed" => "true")].each do |input|
      expect { prepare(input) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
    end
  end

  it "rejects self-review and revoked/mismatched reviewer authority" do
    worker.update!(current_workspace: company)
    worker.add_role(:owner, company)
    self_service = Payroll::ConsultantInvoicePreparation.new(run, actor: worker)
    expect { self_service.record!(expected_revision_digest: revision.digest, employment_id: employment.id, facts:, expected_preparation_id: "", idempotency_key: "self") }.to raise_error(Payroll::Workflow::NotAuthorized)
    accounts.remove_role(:book_keeper, company)
    expect { prepare }.to raise_error(Payroll::Workflow::NotAuthorized)
  end

  it "replays the same command and rejects changed replay or stale review" do
    first = prepare
    expect(prepare.id).to eq(first.id)
    expect { prepare(facts.merge("number" => "2")) }.to raise_error(Payroll::Workflow::Conflict)
    next_receipt = prepare(facts.merge("number" => "2"), key: "next", previous: first.id.to_s)
    expect(next_receipt.previous_preparation_id).to eq(first.id)
    expect { prepare(key: "stale", previous: first.id.to_s) }.to raise_error(Payroll::Workflow::Conflict)
  end

  it "requires the reviewed financial year to match the actual Indian issue date" do
    expect { prepare(facts.merge("financial_year" => "2025-2026")) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
  end

  it "preserves an existing full invoice number and shares uniqueness with the equivalent generated number" do
    generated = facts.merge("series" => "INV", "number" => "1")
    linked = facts.merge("mode" => "existing", "series" => "internal", "number" => "INV/1")
    expect(Payroll::ConsultantInvoicePreparation.invoice_number(generated)).to eq("INV/1")
    expect(Payroll::ConsultantInvoicePreparation.invoice_number(linked)).to eq("INV/1")
    expect(Payroll::ConsultantInvoicePreparation.invoice_number(linked.merge("number" => "INV-2026-0042"))).to eq("INV-2026-0042")
    expect(Payroll::ConsultantInvoicePreparation.number_digest(generated)).to eq(Payroll::ConsultantInvoicePreparation.number_digest(linked))
  end

  it "refuses a payroll revision digest different from the facts the reviewer saw" do
    expect do
      service.record!(employment_id: employment.id, facts:, expected_preparation_id: "", idempotency_key: "revision", expected_revision_digest: "0" * 64)
    end.to raise_error(Payroll::Workflow::Conflict)
  end

  it "rejects other-company subjects and DB mutation/deletion of reviewed facts" do
    other = create(:employment)
    expect { service.record!(expected_revision_digest: revision.digest, employment_id: other.id, facts:, expected_preparation_id: "", idempotency_key: "other") }.to raise_error(ActiveRecord::RecordNotFound)
    receipt = prepare
    expect { PayrollInvoicePreparation.where(id: receipt.id).update_all(facts: {}) }.to raise_error(ActiveRecord::StatementInvalid)
  end

  def original
    file = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    ActionDispatch::Http::UploadedFile.new(tempfile: file.tempfile, filename: "original.pdf", type: "application/pdf")
  end

  def existing_facts
    facts.merge("mode" => "existing", "timing" => "existing_invoice", "original_date" => "2026-11-30")
  end

  it "rejects an unsupported country rather than accepting arbitrary two-letter text" do
    input = facts.merge("billed_entity" => facts["billed_entity"].merge("country" => "ZZ"))
    expect { prepare(input) }.to raise_error(Payroll::ConsultantReview::InvalidInput)
  end

  it "rechecks the assigned reviewer's current workspace" do
    accounts.update!(current_workspace: create(:company))
    expect { prepare }.to raise_error(Payroll::Workflow::NotAuthorized)
  end

  it "allows an admin to configure unreviewed facts but not to self-promote them to reviewed" do
    admin = create(:user, current_workspace: company)
    create(:employment, company:, user: admin, joined_at: "2020-01-01", resigned_at: nil)
    admin.add_role(:admin, company)
    configuration = Payroll::ConsultantInvoicePreparation.new(run, actor: admin)
    draft = configuration.record!(expected_revision_digest: revision.digest, employment_id: employment.id, facts:, expected_preparation_id: "", idempotency_key: "admin-draft", reviewed: false)
    expect(draft).not_to be_reviewed
    expect do
      configuration.record!(expected_revision_digest: revision.digest, employment_id: employment.id, facts:, expected_preparation_id: draft.id.to_s, idempotency_key: "unassigned-review")
    end.to raise_error(Payroll::Workflow::NotAuthorized)
  end

  it "allows only an unreviewed own original submission, then preserves its exact bytes through nonself review" do
    worker.update!(current_workspace: company)
    file = original
    expected = Digest::SHA256.file(file.tempfile.path).hexdigest
    own = Payroll::ConsultantInvoicePreparation.new(run, actor: worker)
    pending = own.record!(expected_revision_digest: revision.digest, employment_id: employment.id, facts: existing_facts.merge("accounts_destination_confirmed" => false), expected_preparation_id: "", idempotency_key: "own-original", original_pdf: file, reviewed: false)
    expect(pending).not_to be_reviewed
    expect(pending.original_blob.download).to eq(File.binread(file.tempfile.path))
    expect(pending.facts.fetch("original")).to include("sha256" => expected)
    reviewed = service.record!(expected_revision_digest: revision.digest, employment_id: employment.id, facts: existing_facts, expected_preparation_id: pending.id.to_s, idempotency_key: "review-original")
    expect(reviewed).to be_reviewed
    expect(reviewed.original_blob_id).to eq(pending.original_blob_id)
    expect(Digest::SHA256.hexdigest(reviewed.original_blob.download)).to eq(expected)
    expect(PayrollConsultantInvoice.count).to eq(0)
    expect { own.record!(expected_revision_digest: revision.digest, employment_id: employment.id, facts: existing_facts, expected_preparation_id: reviewed.id.to_s, idempotency_key: "self-review") }.to raise_error(Payroll::Workflow::NotAuthorized)
  ensure
    file&.close
  end

  it "does not let a consultant prepare generation even as an unreviewed draft" do
    worker.update!(current_workspace: company)
    own = Payroll::ConsultantInvoicePreparation.new(run, actor: worker)
    expect do
      own.record!(expected_revision_digest: revision.digest, employment_id: employment.id, facts:, expected_preparation_id: "", idempotency_key: "own-generation", reviewed: false)
    end.to raise_error(Payroll::Workflow::NotAuthorized)
  end

  it "rejects bytes changed between PDF inspection and upload and removes its own unused blob" do
    file = original
    before_count = ActiveStorage::Blob.count
    allow(service).to receive(:upload).and_wrap_original do |method, input|
      File.open(input.tempfile.path, "ab") { |stream| stream.write("\n%drift\n") }
      method.call(input)
    end
    expect do
      service.record!(expected_revision_digest: revision.digest, employment_id: employment.id, facts: existing_facts, expected_preparation_id: "", idempotency_key: "drift", original_pdf: file)
    end.to raise_error(Payroll::Workflow::Conflict)
    expect(PayrollInvoicePreparation.count).to eq(0)
    expect(ActiveStorage::Blob.count).to eq(before_count)
  ensure
    file&.close
  end

  it "protects prepared source fields in SQL while permitting a valid operational claim" do
    receipt = prepare
    expect do
      PayrollInvoicePreparation.transaction(requires_new: true) { PayrollInvoicePreparation.where(id: receipt.id).update_all(payroll_revision_id: revision.id + 1) }
    end.to raise_error(ActiveRecord::StatementInvalid)
    expect do
      PayrollInvoicePreparation.transaction(requires_new: true) { PayrollInvoicePreparation.where(id: receipt.id).delete_all }
    end.to raise_error(ActiveRecord::StatementInvalid)
    receipt.update!(state: "generating", claim_token: SecureRandom.hex(32), started_at: Time.current)
    expect(receipt.reload.state).to eq("generating")
  end

  it "retains delivery identity in SQL while allowing claim state transitions" do
    receipt = prepare
    group = PayrollPaymentGroup.create!(company:, payroll_run: run, payroll_revision: revision, employment:, entitlement_minor: net_minor,
      required_legs: 1, line_digest: PayrollPaymentGroup.line_digest(revision.payroll_payload.fetch("lines").first))
    worker.update!(current_workspace: company)
    consent = Payroll::InvoiceAuthorization.new(employment, actor: worker)
    consent.record!(action: "grant", expected_event_id: "", statement_digest: consent.summary.dig(:statement, :digest), idempotency_key: "grant")
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("%PDF-synthetic-model-boundary"), filename: "boundary.pdf", content_type: "application/pdf")
    invoice = PayrollConsultantInvoice.create!(company:, payroll_run: run, payroll_revision: revision, employment:, preparation: receipt, issuer: worker,
      authorization: consent.receipt, payroll_payment_group: group, pdf_blob: blob, snapshot: { "synthetic_model_boundary" => true },
      financial_year: "2026-2027", number_digest: "a" * 64, mode: "generate", issued_on: Date.new(2026, 12, 5))
    delivery = PayrollConsultantInvoiceDelivery.create!(payroll_consultant_invoice: invoice, attempt_number: 1)
    [{ attempt_number: 2 }, { payroll_consultant_invoice_id: invoice.id + 1 }, { created_at: 1.day.ago }].each do |changes|
      expect do
        ApplicationRecord.transaction(requires_new: true) { PayrollConsultantInvoiceDelivery.where(id: delivery.id).update_all(changes) }
      end.to raise_error(ActiveRecord::StatementInvalid, /delivery identity/)
    end
    expect do
      ApplicationRecord.transaction(requires_new: true) { PayrollConsultantInvoiceDelivery.where(id: delivery.id).delete_all }
    end.to raise_error(ActiveRecord::StatementInvalid, /delivery identity/)
    delivery.update!(state: "sending", claim_token: SecureRandom.hex(32), started_at: Time.current)
    expect(delivery.reload.state).to eq("sending")
  end
end
