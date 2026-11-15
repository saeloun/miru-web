# frozen_string_literal: true

require "rails_helper"
require "open3"

RSpec.describe "Real consultant invoice PDF" do
  include_context "committed consultant invoice"

  def actual_renderer
    allow(Ferrum::Browser).to receive(:new).and_call_original
    allow_any_instance_of(PdfGeneration::BaseService).to receive(:browser_options).and_return({ "disable-gpu" => nil })
  end

  def parsed_text(invoice)
    Tempfile.create(["synthetic-consultant-invoice", ".pdf"]) do |file|
      file.binmode
      file.write(invoice.pdf_blob.download)
      file.flush
      info = Signatures::PdfInfo.new(file.path).process
      expect(info.fetch("pages").size).to be >= 1
      text, status = Open3.capture2("pdftotext", file.path, "-", unsetenv_others: true)
      expect(status).to be_success
      expect(info.fetch("sha256")).to eq(invoice.snapshot.dig("pdf", "sha256"))
      metadata, metadata_status = Open3.capture2("pdfinfo", file.path, unsetenv_others: true)
      expect(metadata_status).to be_success
      title = metadata.lines.find { |line| line.start_with?("Title:") }.to_s
      expect(title).not_to include("data:", "AAAPC1234D", "Synthetic Consultant", "62500")
      text
    end
  end

  it "parses the actual rendered PDF, with no company-paid bank fee included in consultant income" do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    # Qualify rendering with normal Brave security; no replacement PDF bytes.
    actual_renderer
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    expect(invoice).to be_a(PayrollConsultantInvoice)
    text = parsed_text(invoice)
    %w[Consultant invoice Paid SYN/1 2026-12-05 Synthetic].each { |value| expect(text).to include(value) }
    expect(text).to include("2026-11-01", "2026-11-30", legal_name, "62500.00", "USD", "INR", "Synthetic credit")
    expect(text).not_to match(/OUR|company debit|bank fee/i)
  end

  it "parses a paid statement with a distinct actual generation date while preserving the existing original" do
    upload = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    file = ActionDispatch::Http::UploadedFile.new(tempfile: upload.tempfile, filename: "existing.pdf", type: "application/pdf")
    original = File.binread(file.tempfile.path)
    prepare_consultant_invoice(facts: invoice_facts.merge("mode" => "existing", "timing" => "existing_invoice", "original_date" => "2026-11-30", "series" => "INV", "number" => "INV-2026-0042"), original_pdf: file)
    credited_invoice_leg
    actual_renderer
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    expect(invoice).to be_a(PayrollConsultantInvoice)
    text = parsed_text(invoice)
    expect(text).to include("Paid settlement statement", "Statement generated: 2026-12-05", "Original invoice date: 2026-11-30", "Original invoice: INV-2026-0042", "Synthetic credit")
    expect(text).not_to include("INV/INV-2026-0042")
    expect(invoice.original_blob.download).to eq(original)
  ensure
    file&.close
  end

  it "preserves an explicit HTML document title in real PDF metadata" do
    actual_renderer
    bytes = PdfGeneration::BaseService.new("<html><head><title>Synthetic approved document title</title></head><body>Synthetic title control</body></html>").process
    Tempfile.create(["synthetic-title-control", ".pdf"]) do |file|
      file.binmode
      file.write(bytes)
      file.flush
      metadata, status = Open3.capture2("pdfinfo", file.path, unsetenv_others: true)
      expect(status).to be_success
      title = metadata.lines.find { |line| line.start_with?("Title:") }.to_s
      expect(title).to include("Synthetic approved document title")
      expect(title).not_to include("data:")
    end
  end

  it "preserves exact paise when rendering large integer adjustment amounts" do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    actual_renderer
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    expect(invoice).to be_a(PayrollConsultantInvoice)
    # Exercise the renderer's integer range without relaxing payment input limits.
    snapshot = invoice.snapshot.deep_dup
    snapshot["extras"] = [{ "code" => "other_earning", "amount_minor" => 8_999_999_993_749_999 }]
    snapshot["deductions"] = [{ "code" => "other_deduction", "amount_minor" => 8_999_999_993_749_999 }]
    snapshot["amounts"]["extras_minor"] = 8_999_999_993_749_999
    snapshot["amounts"]["deductions_minor"] = 8_999_999_993_749_999
    bytes = Payroll::ConsultantInvoicePdf.new(snapshot:, kind: "invoice").render
    Tempfile.create(["synthetic-exact-paise", ".pdf"]) do |file|
      file.binmode
      file.write(bytes)
      file.flush
      text, status = Open3.capture2("pdftotext", file.path, "-", unsetenv_others: true)
      expect(status).to be_success
      expect(text.scan("89999999937499.99").size).to eq(2)
      expect(text).not_to include("89999999937499.98")
    end
  end

  context "approved itemized financial amounts" do
    let(:claim) { create(:expense, company:, user: worker, amount: 5_000, currency: "INR", date: Date.new(2026, 11, 2), status: :approved, approved_at: 1.minute.ago) }
    let(:revision) do
      prepared = Payroll::ConsultantRevision.new(run, actor: accounts).create!(consultants: [{ employment_id: employment.id, expense_ids: [claim.id],
        acknowledged: true, other_earning: "250.00", other_deduction: "500.00", withholding: "1000.00" }],
        cutoff: Date.current.iso8601, expected_digest: nil, idempotency_key: "synthetic-itemized")
      workflow.approve!(actor: accounts, stage: "accounts", expected_digest: prepared.digest)
      workflow.approve!(actor: owner, stage: "final", expected_digest: prepared.digest)
      prepared
    end

    it "parses separate fee, reimbursement, adjustment, withholding and actual net settlement lines" do
      prepare_consultant_invoice
      grant_invoice_consent
      credited_invoice_leg
      actual_renderer
      invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
      expect(invoice).to be_a(PayrollConsultantInvoice)
      text = parsed_text(invoice)
      expect(text).to include("Consultancy fees", "62500.00", "Reimbursement:", "5000.00", "Approved adjustment:", "250.00",
        "Withholding", "1000.00", "Approved deduction", "500.00", "66250.00")
      expect(text).not_to match(/OUR|company debit|bank fee/i)
      expect(text).not_to match(/credit_recorded|other_earning|other_deduction|Withholding: withholding/)
      expect(invoice.snapshot.dig("amounts", "net_minor")).to eq(6_625_000)
    end
  end
end
