# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Consultant invoice document support boundary" do
  include_context "committed consultant invoice"
  let(:billing_identity_ready) { false }
  let(:gst_scheme) { nil }
  before { review_synthetic_billing_identity(employment:, reviewer: owner, gst_scheme:) }

  def forged_generated_preparation
    line = revision.payroll_payload.fetch("lines").sole
    frozen = invoice_facts.merge("revision_digest" => revision.digest, "line_digest" => Payroll::IndiaHandoff.line_digest(line),
      "billing_identity" => line.dig("preparation", "billing_identity"), "supplemental_billing" => false,
      "accounts_email" => Payroll::ConsultantInvoicePreparation::ACCOUNTS_EMAIL)
    PayrollInvoicePreparation.create!(company:, payroll_run: run, payroll_revision: revision, employment:, actor: accounts,
      facts: frozen, reviewed: true, idempotency_key: "bypassed-preparation-service", command_digest: Payroll::ConsultantInvoicePreparation.digest(frozen))
  end

  %w[regular composition other].each do |scheme|
    context "with an actually reviewed registered #{scheme} billing receipt" do
      let(:gst_scheme) { scheme }

      it "refuses reviewed generic generation without reserving an invoice" do
        expect do
          prepare_consultant_invoice
        end.to raise_error(Payroll::ConsultantReview::InvalidInput, /existing invoice/i)
        expect(PayrollInvoicePreparation.count).to eq(0)
        expect(PayrollConsultantInvoice.count).to eq(0)
      end

      it "also blocks issuance when a caller bypasses preparation service validation" do
        preparation = forged_generated_preparation
        grant_invoice_consent
        credited_invoice_leg
        result = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
        expect(result).to eq(preparation)
        expect(preparation.reload.error_code).to eq("unsupported_generated_document")
        expect(PayrollConsultantInvoice.count).to eq(0)
      end

      it "still links exact original bytes and creates only the separate paid statement" do
        upload = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
        file = ActionDispatch::Http::UploadedFile.new(tempfile: upload.tempfile, filename: "existing-registered.pdf", type: "application/pdf")
        bytes = File.binread(file.tempfile.path)
        facts = invoice_facts.merge("mode" => "existing", "series" => "", "number" => "GST-2026-0042", "timing" => "existing_invoice", "original_date" => "2026-11-30")
        prepare_consultant_invoice(facts:, original_pdf: file)
        credited_invoice_leg
        invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
        expect(invoice).to be_a(PayrollConsultantInvoice)
        expect(invoice.mode).to eq("existing")
        expect(invoice.original_blob.download).to eq(bytes)
        expect(invoice.snapshot.dig("consultant", "gst_scheme")).to eq(scheme)
        expect(Payroll::ConsultantInvoicePreparation.invoice_number(invoice.snapshot)).to eq("GST-2026-0042")
        expect(PayrollConsultantInvoice.count).to eq(1)
      ensure
        file&.close
      end
    end
  end

  %w[needs_review unknown].each do |status|
    context "if a frozen reader returns unsupported #{status} status" do
      # Existing billing review already refuses needs_review. This controlled
      # reader result checks a future/invalid status cannot bypass issuance.
      def unsupported_reader(status)
        allow_any_instance_of(Payroll::BillingIdentity).to receive(:frozen_binding!).and_wrap_original do |method, *args, **kwargs|
          method.call(*args, **kwargs).merge("gst_status" => status)
        end
      end

      it "refuses reviewed generation" do
        revision
        unsupported_reader(status)
        expect { prepare_consultant_invoice }.to raise_error(Payroll::ConsultantReview::InvalidInput, /existing invoice/i)
        expect(PayrollInvoicePreparation.count).to eq(0)
      end

      it "refuses a bypassed preparation at issuance" do
        preparation = forged_generated_preparation
        grant_invoice_consent
        credited_invoice_leg
        unsupported_reader(status)
        expect(Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!).to eq(preparation)
        expect(preparation.reload.error_code).to eq("unsupported_generated_document")
        expect(PayrollConsultantInvoice.count).to eq(0)
      end
    end
  end
end
