# frozen_string_literal: true

module InvoiceSendable
  extend ActiveSupport::Concern

  def send_to_email(subject:, recipients:, message:)
    InvoiceMailer.with(invoice_id: self.id, subject:, recipients:, message:).invoice.deliver_later
  end
end
