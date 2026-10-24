# frozen_string_literal: true

class SignatureReviewMailer < ApplicationMailer
  class DeliveryFailure < StandardError; end

  after_deliver do
    @invitation.update!(email_status: mail.perform_deliveries ? "sent" : "failed",
      email_sent_at: mail.perform_deliveries ? Time.current : nil) if @review_url
  end
  rescue_from DeliveryFailure do
    @invitation&.update!(email_status: "failed")
    raise DeliveryFailure, "Review invitation could not be sent. Request a new invitation.", cause: nil
  end

  def invite(invitation_id)
    @invitation = SignatureReviewInvitation.find(invitation_id)
    return unless @invitation.active?

    @company = @invitation.revision.signature_request.company
    @review_url = document_review_url(anchor: @invitation.access_token)
    mail(to: @invitation.recipient.fetch("email"), subject: "Review a document") do |format|
      format.html
      format.text
    end
  end

  # Rails logs the full encoded mail and delivery exceptions, including private links.
  def self.deliver_mail(message)
    ActiveSupport::Notifications.instrument("deliver.action_mailer", mailer: name, message_id: message.message_id,
      perform_deliveries: message.perform_deliveries, mail: "[FILTERED]") do
      yield
    rescue StandardError
      raise DeliveryFailure, "Review invitation could not be sent. Request a new invitation.", cause: nil
    end
  end
end
