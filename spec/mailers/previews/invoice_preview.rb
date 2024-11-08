# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/invoice

class InvoicePreview < ActionMailer::Preview
  def invoice
    invoice = Invoice.last
    invoice_id = invoice.id
    recipients = [invoice.client.email, "miru@example.com"]
    subject = "Invoice (#{invoice.invoice_number}) due on #{invoice.due_date}"
    message = "#{invoice.client.company.name} has sent you an invoice (#{invoice.invoice_number}) for $#{invoice.amount.to_i} that's due on #{invoice.due_date}."

    InvoiceMailer.with(invoice_id:, recipients:, subject:, message:).invoice
  end
end
