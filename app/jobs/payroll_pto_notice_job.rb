# frozen_string_literal: true

class PayrollPtoNoticeJob < ApplicationJob
  def perform(id)
    notice = PayrollPtoNotification.find(id)
    send_now = notice.with_lock do
      next false unless notice.state == "queued"
      next false unless notice.recipient_eligible? && Payroll::Entitlement.enabled?(notice.company_id)
      notice.update!(state: "sending", attempted_at: Time.current)
      true
    end
    return unless send_now

    PayrollPtoMailer.review(notice.id).deliver_now
    notice.update!(state: "sent", sent_at: Time.current)
  rescue StandardError
    notice&.update!(state: "uncertain") if send_now
    Rails.logger.warn("Payroll PTO notice delivery requires review")
  end
end
