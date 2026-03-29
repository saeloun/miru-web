# frozen_string_literal: true

require_relative "preview_support"

# Preview all emails at http://localhost:3000/rails/mailers/invoice

class InvoicePreview < ActionMailer::Preview
  include PreviewSupport

  def invoice
    invoice = sample_invoice
    recipients = [invoice.client.email, "ops@miru.so"]
    subject = "Invoice (#{invoice.invoice_number}) due on #{invoice.due_date}"
    message = "#{invoice.client.company.name} has sent you an invoice (#{invoice.invoice_number}) for $#{invoice.amount.to_i} that's due on #{invoice.due_date}."

    InvoiceMailer.with(invoice_id: invoice.id, recipients:, subject:, message:).invoice
  end
end
