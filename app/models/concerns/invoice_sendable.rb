# frozen_string_literal: true

module InvoiceSendable
  extend ActiveSupport::Concern

  def send_to_email(subject:, recipients:)
    InvoiceMailer.with(invoice: self, subject:, recipients:).invoice.deliver_later
  end
end
