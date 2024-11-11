# frozen_string_literal: true

module InvoiceSendable
  extend ActiveSupport::Concern

  def send_to_email(subject:, recipients:, message:, current_user_id:)
    InvoiceMailer.with(invoice_id: self.id, subject:, recipients:, message:, current_user_id:).invoice.deliver_later
  end
end
