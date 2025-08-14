# frozen_string_literal: true

class Api::V1::SnsSubscriptionsController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  skip_before_action :verify_authenticity_token

  def create
    sns_message = JSON.parse(request.body.read)

    if sns_message["Type"] == "SubscriptionConfirmation"
      HTTParty.get(sns_message["SubscribeURL"])
      render json: { message: "Subscription confirmed successfully" }, status: 200
    else
      message = JSON.parse(sns_message["Message"])

      if message["eventType"] == "Bounce"
        handle_bounced_email(message)
      elsif message["eventType"] == "Complaint"
        handle_compliant_email(message)
      end

      render json: { message: "success" }, status: 200
    end
  end

  private

    def handle_bounced_email(message)
      bounce_recipients = message.dig("bounce", "bouncedRecipients")
      bounce_recipients.each do |recipient|
        next if recipient["action"] != "failed"

        SesInvalidEmail.find_or_create_by(email: recipient["emailAddress"], bounce: true)
      end
    end

    def handle_compliant_email(message)
      compliant_recipients = message.dig("complaint", "complainedRecipients")
      compliant_recipients.each do |recipient|
        SesInvalidEmail.find_or_create_by(email: recipient["emailAddress"], compliant: true)
      end
    end
end
