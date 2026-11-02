# frozen_string_literal: true

class Hiring::InboundEmailsController < ActionMailbox::BaseController
  before_action :require_password, :authenticate_by_password, :require_rfc822

  rescue_from ActiveRecord::RecordNotFound do
    head 404
  end
  rescue_from Hiring::ReceiveEmail::InvalidInput do
    head 422
  end
  rescue_from Hiring::ReceiveEmail::Unavailable do
    head 503
  end

  def create
    mailbox = HiringMailbox.where(active: true).find_by!(routing_key: params[:routing_key])
    return head(413) if request.content_length.to_i > Hiring::ReceiveEmail::MAX_BYTES

    source = request.body.read(Hiring::ReceiveEmail::MAX_BYTES + 1)
    return head(413) if source.bytesize > Hiring::ReceiveEmail::MAX_BYTES

    Hiring::ReceiveEmail.new(mailbox:, source:).process
    head 204
  end

  private

    def ingress_name = :hiring

    def require_password
      head 503 if password.blank?
    end

    def require_rfc822
      head 415 unless request.media_type == "message/rfc822"
    end
end
