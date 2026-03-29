# frozen_string_literal: true

require_relative "preview_support"

# Preview all emails at http://localhost:3000/rails/mailers/invoice_mailer
class InvoiceMailerPreview < ActionMailer::Preview
  include PreviewSupport

  def send_invoice
    invoice = sample_invoice

    InvoiceMailer.with(
      invoice: invoice,
      pdf_data: sample_pdf_data,
      subject: "Invoice #{invoice.invoice_number} from #{invoice.company.name}",
      recipients: [invoice.client.email],
      message: "Please find attached the invoice for services rendered. Payment is due by #{invoice.due_date.strftime('%B %d, %Y')}.\n\nThank you for your business!"
    ).send_invoice
  end

  def invoice
    invoice = sample_invoice

    InvoiceMailer.with(
      invoice_id: invoice.id,
      subject: "Invoice #{invoice.invoice_number}",
      recipients: [invoice.client.email],
      message: "Please review the attached invoice."
    ).invoice
  end
end
