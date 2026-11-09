# frozen_string_literal: true

class PayrollBankChangeNoticeJob < ApplicationJob
  def perform(id)
    raise ActiveRecord::ActiveRecordError, "Bank-change delivery requires committed records" if PayrollBankChangeNotice.connection.transaction_open?

    notice = PayrollBankChangeNotice.find_by(id:)
    return unless notice

    mail = claim(notice)
    return unless mail

    mail.deliver_now
    notice.with_lock { notice.update!(state: "sent", sent_at: Time.current) if notice.state == "sending" }
  rescue StandardError
    mark_uncertain(notice) if mail
    Rails.logger.warn("Payroll bank-change notice delivery requires review")
  end

  private

    def claim(notice)
      notice.with_lock do
        next unless notice.state == "queued"
        unless Payroll::Entitlement.enabled?(notice.company_id) && notice.recipient_eligible?
          notice.update!(state: "skipped")
          next
        end
        mail = PayrollBankChangeMailer.changed(notice.id)
        message = mail.message
        next unless message.perform_deliveries

        message.raise_delivery_errors = true
        notice.update!(state: "sending", attempted_at: Time.current)
        mail
      end
    end

    def mark_uncertain(notice)
      notice.with_lock { notice.update!(state: "uncertain") if notice.state == "sending" }
    rescue StandardError
      # A stale sending row is also recovered as uncertain, never automatically resent.
      nil
    end
end
