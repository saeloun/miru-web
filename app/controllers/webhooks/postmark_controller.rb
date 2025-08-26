# frozen_string_literal: true

class Webhooks::PostmarkController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  skip_before_action :verify_authenticity_token

  def bounces
    handle_bounce(params)
    head :ok
  rescue StandardError => e
    Rails.logger.error "Postmark webhook error: #{e.message}"
    head :unprocessable_entity
  end

  def spam_complaints
    handle_spam_complaint(params)
    head :ok
  rescue StandardError => e
    Rails.logger.error "Postmark webhook error: #{e.message}"
    head :unprocessable_entity
  end

  private

    def handle_bounce(webhook_params)
      email = webhook_params[:Email] || webhook_params[:Recipient]
      return unless email

      # Record bounced email
      InvalidEmail.find_or_create_by(email: email.downcase) do |record|
        record.bounce = true
      end

      Rails.logger.info "Recorded bounce for email: #{email}"
    end

    def handle_spam_complaint(webhook_params)
      email = webhook_params[:Email] || webhook_params[:Recipient]
      return unless email

      # Record spam complaint
      InvalidEmail.find_or_create_by(email: email.downcase) do |record|
        record.compliant = true
      end

      Rails.logger.info "Recorded spam complaint for email: #{email}"
    end
end