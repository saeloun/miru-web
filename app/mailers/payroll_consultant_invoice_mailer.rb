# frozen_string_literal: true

# rubocop:disable Rails/ApplicationMailer -- Confidential transport failures belong to the durable attempt.
class PayrollConsultantInvoiceMailer < ActionMailer::Base
  # rubocop:enable Rails/ApplicationMailer
  include PrivateMailDelivery
  default from: ApplicationMailer.default.fetch(:from), reply_to: ApplicationMailer.default.fetch(:reply_to)

  def invoice(delivery_id)
    attempt = PayrollConsultantInvoiceDelivery.find(delivery_id)
    invoice = attempt.payroll_consultant_invoice
    address = Payroll::ConsultantInvoiceDelivery.recipient(invoice)
    snapshot = invoice.snapshot
    number = Payroll::ConsultantInvoicePreparation.invoice_number(snapshot)
    @summary = { "Invoice" => number,
                 "Financial year" => invoice.financial_year, "Original issue date" => invoice.issued_on.iso8601,
                 "Document" => invoice.mode == "existing" ? "Original invoice and paid settlement statement" : "Paid consultant invoice" }
    attachments["consultant-#{invoice.id}-paid.pdf"] = Payroll::ConsultantInvoiceDelivery.pdf_bytes(invoice, kind: :paid)
    if invoice.mode == "existing"
      attachments["consultant-#{invoice.id}-original.pdf"] = Payroll::ConsultantInvoiceDelivery.pdf_bytes(invoice, kind: :original)
    end
    mail(to: address, subject: "Consultant paid invoice #{number}")
  end
end
