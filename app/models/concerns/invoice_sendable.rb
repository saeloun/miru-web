# frozen_string_literal: true

module InvoiceSendable
  extend ActiveSupport::Concern

  def send_to_email(subject:, recipients:, message:)
    InvoiceMailer.with(invoice_id: self.id, subject:, recipients:, message:).invoice.deliver_later
  end

  def record_send!(recipients_count:)
    attrs = {}
    attrs[:status] = "sent" if draft?
    attrs[:sent_at] = Time.current if sent_at.nil?
    transaction do
      update!(attrs) if attrs.any?
      Rails.event.notify(Invoices::Sent.new(self, recipients_count:))
    end
  end
end
