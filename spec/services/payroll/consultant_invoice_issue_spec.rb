# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant paid invoice issuance" do
  include_context "committed consultant invoice"
  let(:issuer) { Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id) }

  it "waits for real confirmed credit without consuming a reviewed invoice number" do
    preparation = prepare_consultant_invoice
    grant_invoice_consent
    prepared_instruction(revision:)
    expect(issuer.issue!).to eq(preparation)
    expect(PayrollConsultantInvoice.count).to eq(0)
    expect(preparation.reload.state).to eq("waiting_credit")
  end

  it "issues once with frozen entitlement, USD settlement and separate company bank costs" do
    preparation = prepare_consultant_invoice
    consent = grant_invoice_consent
    leg = credited_invoice_leg
    invoice = issuer.issue!
    expect(invoice).to be_a(PayrollConsultantInvoice)
    expect(invoice).to have_attributes(preparation_id: preparation.id, authorization_id: consent.receipt.id, issued_on: Date.new(2026, 12, 5))
    expect(invoice.snapshot).to include("status" => "Paid", "currency" => "INR", "amounts" => revision.payroll_payload.fetch("lines").first.fetch("amounts"))
    expect(invoice.snapshot.fetch("settlements").first).to include("principal_minor" => leg.principal_minor, "credited_minor" => net_minor)
    expect(invoice.snapshot.fetch("company_bank_costs").first).to include("fee_minor" => leg.fee_minor)
    expect(invoice.payroll_consultant_invoice_deliveries.sole.state).to eq("queued")
    expect(issuer.issue!.id).to eq(invoice.id)
    expect(PayrollConsultantInvoice.count).to eq(1)
    expect(Invoice.count).to eq(0)
  end

  it "blocks withdrawal or reviewer revocation during rendering and cleans only its unused PDF" do
    preparation = prepare_consultant_invoice
    consent = grant_invoice_consent
    credited_invoice_leg
    initial_blobs = ActiveStorage::Blob.count
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render).and_wrap_original do |method|
      result = method.call
      current = consent.summary
      consent.record!(action: "withdraw", expected_event_id: current.dig(:current_event, :id), statement_digest: "", idempotency_key: "withdraw-during-render")
      result
    end
    expect(issuer.issue!).to eq(preparation)
    expect(PayrollConsultantInvoice.count).to eq(0)
    expect(ActiveStorage::Blob.count).to eq(initial_blobs)
    expect(preparation.reload.error_code).to eq("consent_changed")
  end

  it "returns an already issued original after withdrawal, exit and later payment reopening" do
    prepare_consultant_invoice
    consent = grant_invoice_consent
    leg = credited_invoice_leg
    invoice = issuer.issue!
    original_hash = Digest::SHA256.hexdigest(invoice.pdf_blob.download)
    event = consent.summary.dig(:current_event, :id)
    consent.record!(action: "withdraw", expected_event_id: event, statement_digest: "", idempotency_key: "later-withdraw")
    employment.update!(resigned_at: "2026-12-04")
    leg.update!(transaction_status: "reversed")
    leg.payroll_payment_group.update!(fully_credited_at: nil)
    expect(issuer.issue!.id).to eq(invoice.id)
    expect(Digest::SHA256.hexdigest(invoice.pdf_blob.download)).to eq(original_hash)
  end

  it "can issue a kept consultant's credited final settlement after exit with an intact grant" do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    employment.update!(resigned_at: "2026-12-04")
    expect(issuer.issue!).to be_a(PayrollConsultantInvoice)
  end

  it "blocks new issuance when payroll is disabled while retaining an already issued invoice" do
    preparation = prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    expect(issuer.issue!).to eq(preparation)
    expect(preparation.reload.error_code).to eq("payroll_disabled")
    expect(PayrollConsultantInvoice.count).to eq(0)
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("true")
    invoice = issuer.issue!
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    expect(issuer.issue!.id).to eq(invoice.id)
  end

  it "retains completed bank credit when rendering is unavailable" do
    preparation = prepare_consultant_invoice
    grant_invoice_consent
    leg = credited_invoice_leg
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render).and_raise("Synthetic renderer unavailable")
    expect(issuer.issue!).to eq(preparation)
    expect(preparation.reload).to have_attributes(state: "failed", error_code: "render_unavailable")
    expect(leg.reload.credit_state).to eq("credited")
    expect(leg.payroll_payment_group.reload.fully_credited_at).to be_present
  end

  it "links an existing original without a generation grant and creates a separate paid statement" do
    upload = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    file = ActionDispatch::Http::UploadedFile.new(tempfile: upload.tempfile, filename: "existing.pdf", type: "application/pdf")
    original = File.binread(file.tempfile.path)
    preparation = prepare_consultant_invoice(facts: invoice_facts.merge("mode" => "existing", "timing" => "existing_invoice", "original_date" => "2026-11-30"), original_pdf: file)
    credited_invoice_leg
    invoice = issuer.issue!
    expect(invoice).to have_attributes(mode: "existing", authorization_id: nil, issued_on: Date.new(2026, 11, 30))
    expect(invoice.original_blob_id).to eq(preparation.original_blob_id)
    expect(invoice.original_blob.download).to eq(original)
    expect(invoice.pdf_blob_id).not_to eq(invoice.original_blob_id)
    expect(invoice.snapshot.fetch("document_on")).to eq("2026-12-05")
    html = PdfGeneration::HtmlTemplateService.new("payroll_consultant_invoices/paid_settlement", locals: { snapshot: invoice.snapshot, kind: "paid_settlement" }).html_content
    expect(html).to include("Original invoice date:", "2026-11-30", "Statement generated:", "2026-12-05")
    expect(issuer.issue!.id).to eq(invoice.id)
  ensure
    file&.close
  end

  it "uses the exact historical billing receipt after a later profile and historic reviewer workspace change" do
    preparation = prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    binding = preparation.facts.fetch("billing_identity")
    before_facts = Payroll::BillingIdentity.new(employment).frozen_binding!(binding, verify_evidence: true)
    worker.update!(current_workspace: company)
    Payroll::BillingIdentity.new(employment, actor: worker).submit!(facts: before_facts.merge("legal_name" => "Later Synthetic Name"),
      expected_submission_id: binding.fetch("submission_id"), idempotency_key: "later-profile", reuse_pan_evidence: true)
    owner.remove_role(:owner, company)
    owner.update!(current_workspace: create(:company))
    invoice = issuer.issue!
    expect(invoice.snapshot.fetch("consultant")).to eq(before_facts)
    expect(invoice.snapshot.fetch("billing_receipt")).to eq(binding)
  end

  it "blocks an older reviewed future-dated original independently of the preparation validator" do
    upload = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    file = ActionDispatch::Http::UploadedFile.new(tempfile: upload.tempfile, filename: "legacy-original.pdf", type: "application/pdf")
    valid = prepare_consultant_invoice(facts: invoice_facts.merge("mode" => "existing", "timing" => "existing_invoice", "original_date" => "2026-12-05"), original_pdf: file)
    legacy = valid.dup
    legacy.previous_preparation = valid
    legacy.facts = valid.facts.merge("original_date" => "2026-12-06")
    legacy.idempotency_key = "legacy-future-original"
    legacy.save!
    credited_invoice_leg
    expect(issuer.issue!).to eq(legacy)
    expect(legacy.reload).to have_attributes(state: "blocked", error_code: "original_date_in_future")
    expect(PayrollConsultantInvoice.count).to eq(0)
    expect(legacy.original_blob.download).to eq(File.binread(file.tempfile.path))
  ensure
    file&.close
  end

  it "issues an original dated today and preserves its bytes and date on later replay" do
    upload = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    file = ActionDispatch::Http::UploadedFile.new(tempfile: upload.tempfile, filename: "today-original.pdf", type: "application/pdf")
    prepare_consultant_invoice(facts: invoice_facts.merge("mode" => "existing", "timing" => "existing_invoice", "original_date" => "2026-12-05"), original_pdf: file)
    credited_invoice_leg
    invoice = issuer.issue!
    travel 2.days
    expect(issuer.issue!.id).to eq(invoice.id)
    expect(invoice.issued_on).to eq(Date.new(2026, 12, 5))
    expect(invoice.original_blob.download).to eq(File.binread(file.tempfile.path))
  ensure
    file&.close
  end

  it "lets a fresh owner review an already credited historical run after its old approver leaves" do
    grant_invoice_consent
    credited_invoice_leg
    owner.remove_role(:owner, company)
    owner.update!(current_workspace: create(:company))
    fresh_owner = create(:user, current_workspace: company)
    create(:employment, company:, user: fresh_owner, joined_at: "2020-01-01", resigned_at: nil)
    fresh_owner.add_role(:owner, company)
    preparation = Payroll::ConsultantInvoicePreparation.new(run, actor: fresh_owner).record!(employment_id: employment.id, facts: invoice_facts,
      expected_revision_digest: revision.digest, expected_preparation_id: "", idempotency_key: "fresh-historical-review")
    expect(preparation).to be_reviewed
    invoice = issuer.issue!
    expect(invoice).to be_a(PayrollConsultantInvoice)
    expect(invoice.payroll_revision_id).to eq(revision.id)
    expect(invoice.snapshot.dig("amounts", "net_minor")).to eq(net_minor)
  end

  it "does not treat an unpaid historical revision as confirmed credit after an approver leaves" do
    revision
    owner.remove_role(:owner, company)
    expect do
      prepare_consultant_invoice
    end.to raise_error(Payroll::Workflow::Conflict)
    expect(PayrollInvoicePreparation.count).to eq(0)
  end

  it "rejects historical completion columns without the matching immutable credit events" do
    leg = prepared_instruction(revision:)
    leg.update!(credit_state: "credited", credited_minor: leg.entitlement_minor)
    leg.payroll_payment_group.update!(fully_credited_at: Time.current)
    owner.remove_role(:owner, company)
    expect { prepare_consultant_invoice }.to raise_error(Payroll::Workflow::Conflict)
    expect(PayrollInvoicePreparation.count).to eq(0)
  end

  ["one approval", "changed parent digest", "changed payload digest"].each do |defect|
    it "rejects a credited historical source with #{defect}" do
      credited_invoice_leg
      owner.remove_role(:owner, company)
      payload = revision.payroll_payload.deep_dup
      payload.fetch("lines").first.fetch("amounts")["base_minor"] += 1 if defect == "changed payload digest"
      retained = PayrollRevision.new(payroll_run: run, created_by: accounts, number: 2, parent_digest: defect == "changed parent digest" ? "0" * 64 : revision.digest,
        idempotency_key: "invalid-historical-#{defect}", payroll_payload: payload,
        digest: PayrollRevision.chain_digest(Payroll::Snapshot.new(run, revision.payroll_payload).digest, revision.digest, 2))
      retained.save!(validate: false)
      revision.payroll_approvals.to_a.take(defect == "one approval" ? 1 : 2).each do |approval|
        copy = approval.dup
        copy.payroll_revision = retained
        copy.save!(validate: false)
      end
      expect do
        Payroll::ConsultantInvoicePreparation.new(run, actor: accounts).record!(employment_id: employment.id, facts: invoice_facts,
          expected_revision_digest: retained.digest, expected_preparation_id: "", idempotency_key: "invalid-historical-review")
      end.to raise_error(Payroll::Workflow::Conflict)
      expect(PayrollInvoicePreparation.count).to eq(0)
    end
  end

  it "blocks real credit reopened during rendering even if a completion timestamp is stale" do
    preparation = prepare_consultant_invoice
    grant_invoice_consent
    leg = credited_invoice_leg
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render).and_wrap_original do |method|
      result = method.call
      leg.update!(transaction_status: "reversed")
      result
    end
    expect(issuer.issue!).to eq(preparation)
    expect(PayrollConsultantInvoice.count).to eq(0)
    expect(preparation.reload.error_code).to eq("waiting_credit")
  end

  it "checks fresh reviewer authority again after rendering" do
    preparation = prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render).and_wrap_original do |method|
      result = method.call
      accounts.remove_role(:book_keeper, company)
      result
    end
    expect(issuer.issue!).to eq(preparation)
    expect(PayrollConsultantInvoice.count).to eq(0)
    expect(preparation.reload.error_code).to eq("reviewer_unavailable")
  end

  it "requires explicit supplemental billing review for an immutable legacy revision without a binding" do
    grant_invoice_consent
    credited_invoice_leg
    binding = Payroll::BillingIdentity.new(employment).binding
    # A synthetic pre-binding persisted shape: retain the original approved row
    # and bank leg; do not disable or rewrite any immutable database history.
    payload = revision.payroll_payload.deep_dup
    payload.fetch("lines").first.fetch("preparation").delete("billing_identity")
    legacy = PayrollRevision.new(payroll_run: run, created_by: accounts, number: 2, parent_digest: revision.digest, idempotency_key: "synthetic-legacy",
      payroll_payload: payload, digest: PayrollRevision.chain_digest(Payroll::Snapshot.new(run, payload).digest, revision.digest, 2))
    legacy.save!(validate: false)
    revision.payroll_approvals.each do |approval|
      retained = approval.dup
      retained.payroll_revision = legacy
      retained.save!(validate: false)
    end
    preparation = Payroll::ConsultantInvoicePreparation.new(run, actor: accounts).record!(employment_id: employment.id,
      facts: invoice_facts.merge("supplemental_billing_binding" => binding), expected_revision_digest: legacy.digest, expected_preparation_id: "", idempotency_key: "supplemental-review")
    invoice = issuer.issue!
    expect(invoice).to be_a(PayrollConsultantInvoice)
    expect(invoice.payroll_revision_id).to eq(legacy.id)
    expect(invoice.snapshot.fetch("billing_receipt")).to eq(binding)
    expect(invoice.snapshot.fetch("supplemental_billing")).to be(true)
    expect(preparation.facts.fetch("supplemental_billing")).to be(true)
    expect(legacy.reload.payroll_payload.dig("lines", 0, "preparation", "billing_identity")).to be_nil
  end

  it "refuses changed preparation facts once an invoice already exists" do
    preparation = prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    invoice = issuer.issue!
    expect do
      Payroll::ConsultantInvoicePreparation.new(run, actor: accounts).record!(employment_id: employment.id,
        facts: invoice_facts.merge("number" => "2"), expected_revision_digest: revision.digest, expected_preparation_id: preparation.id.to_s, idempotency_key: "after-issue")
    end.to raise_error(Payroll::Workflow::Conflict)
    expect(issuer.issue!.id).to eq(invoice.id)
  end

  it "rebuilds a midnight candidate once using the actual Indian issue date" do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    rendered = 0
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render).and_wrap_original do |method|
      rendered += 1
      bytes = method.call
      travel_to(Time.utc(2026, 12, 5, 19))
      bytes
    end
    invoice = issuer.issue!
    expect(rendered).to eq(2)
    expect(invoice.issued_on).to eq(Date.new(2026, 12, 6))
    expect(invoice.snapshot.fetch("issued_on")).to eq("2026-12-06")
  end

  it "requires fresh numbering review when the actual Indian financial year changes" do
    travel_to(Time.utc(2027, 3, 31, 18, 29))
    preparation = prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    allow_any_instance_of(Payroll::ConsultantInvoicePdf).to receive(:render).and_wrap_original do |method|
      bytes = method.call
      travel_to(Time.utc(2027, 3, 31, 18, 31))
      bytes
    end
    expect(issuer.issue!).to eq(preparation)
    expect(preparation.reload.error_code).to eq("numbering_review_required")
    expect(PayrollConsultantInvoice.count).to eq(0)
  end

  it "waits for both split beneficiaries and issues one consultant invoice linked to both" do
    prepare_consultant_invoice
    grant_invoice_consent
    spouse_id = "66666666-6666-4666-8666-666666666666"
    details = { "bank_account_name" => "Synthetic Spouse", "bank_name" => "Spouse Bank", "bank_country" => "IN", "bank_account_currency" => "INR", "bank_account_number" => "222233334444", "bank_ifsc" => "SPOU0000002", "bank_swift" => "SPOUINBBXXX" }
    splits = Payroll::SplitArrangements.new(run)
    arrangement = splits.request!(actor: accounts, employment_id: employment.id,
      attributes: { allocation_kind: "percentage", allocation_value: "25", allocated_to: "spouse", remainder_to: "consultant" }, details:, account_number_confirmation: details["bank_account_number"])
    splits.verify!(actor: accounts, arrangement_id: arrangement.id)
    splits.approve!(actor: owner, arrangement_id: arrangement.id)
    stub_mercury_reads
    stub_request(:get, "#{mercury_base}/recipient/#{spouse_id}").to_return(mercury_json(mercury_recipient("id" => spouse_id, "name" => "Synthetic Spouse",
      "internationalWireRoutingInfo" => { "iban" => details["bank_account_number"], "swiftCode" => details["bank_swift"], "countrySpecific" => { "india" => { "ifscCode" => details["bank_ifsc"] } } })))
    verified_connection
    linked_recipient
    linked_recipient(beneficiary: "spouse", id: spouse_id)
    payment = Payroll::MercuryPayment.new(run)
    legs = payment.prepare!(actor: owner, employment_id: employment.id, expected_digest: revision.digest, quote:)
    legs.each do |leg|
      response = mercury_request("status" => "approved", "requestId" => SecureRandom.uuid, "recipientId" => leg.mercury_recipient_id, "amount" => leg.principal_minor / 100.0)
      stub_mercury_write(mercury_json(response))
      payment.submit!(actor: owner, instruction_id: leg.id, expected_digest: leg.frozen_digest)
    end
    credit_invoice_leg(legs.first)
    expect(issuer.issue!).to be_a(PayrollInvoicePreparation)
    expect(PayrollConsultantInvoice.count).to eq(0)
    credit_invoice_leg(legs.last)
    invoice = issuer.issue!
    expect(invoice.snapshot.fetch("settlements").pluck("beneficiary")).to match_array(%w[consultant spouse])
    expect(invoice.snapshot.dig("consultant", "legal_name")).to eq("Synthetic Consultant")
    expect(PayrollConsultantInvoice.count).to eq(1)
  end

  context "India funding" do
    let(:invoice_funding) { "india" }

    it "issues only after the actual India credit and keeps billed entity independent of funding" do
      prepare_consultant_invoice
      grant_invoice_consent
      india = Payroll::IndiaHandoff.new(run)
      handoff = india.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
        accounts_email: "accounts@saeloun.com", bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
      handoff.payroll_india_deliveries.sole.update!(state: "sent", sent_at: Time.current)
      expect(issuer.issue!).to be_a(PayrollInvoicePreparation)
      india.record_credit!(actor: accounts, handoff_id: handoff.id, amount: "62500", credited_on: "2026-12-05", reference: "Synthetic India bank credit")
      invoice = issuer.issue!
      expect(invoice.payroll_india_handoff_id).to eq(handoff.id)
      expect(invoice.snapshot.dig("billed_entity", "name")).to eq(legal_name)
      expect(invoice.snapshot.fetch("settlements").sole).to include("reference" => "SYNTHETICINDIABANKCREDIT", "credited_minor" => net_minor)
      expect(invoice.snapshot.fetch("company_bank_costs")).to eq([])
    end
  end
end
