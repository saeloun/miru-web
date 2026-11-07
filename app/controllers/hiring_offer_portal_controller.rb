# frozen_string_literal: true

class HiringOfferPortalController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :private_headers

  rescue_from HiringOffer::Unavailable do
    render json: { errors: "This offer link is unavailable. Ask the hiring team for help." }, status: 410
  end
  rescue_from ActionController::InvalidAuthenticityToken do
    render json: { errors: "This page expired. Open your original offer link again." }, status: 422
  end
  rescue_from ActionController::BadRequest, ActionController::ParameterMissing do
    render json: { errors: "Invalid offer request." }, status: 400
  end
  rescue_from Hiring::Intake::Conflict, ActiveRecord::StaleObjectError do
    render json: { errors: "The offer changed or already has a response. Reload before responding." }, status: 409
  end

  def show
    render :show, layout: false
  end

  def open
    with_offer(%w[token]) { render json: { offer: @offer.candidate_details } }
  end

  def reply
    with_offer(%w[token offer_version outcome]) do |attributes|
      unless attributes["offer_version"].is_a?(Integer) && attributes["offer_version"] >= 0 && %w[accepted declined].include?(attributes["outcome"])
        raise ActionController::BadRequest
      end
      @offer.reply!(attributes.except("token"))
      render json: { offer: @offer.candidate_details }
    end
  end

  private

    def with_offer(keys)
      value = params.require(:offer_portal)
      raise ActionController::BadRequest unless value.is_a?(ActionController::Parameters) && value.keys.sort == keys.sort

      attributes = value.to_unsafe_h
      token = attributes["token"]
      raise HiringOffer::Unavailable unless token.is_a?(String) && token.match?(HiringPortalAccess::TOKEN)

      @offer = HiringOffer.find_by(access_token: token)
      raise HiringOffer::Unavailable unless @offer

      @offer.company.with_lock("FOR NO KEY UPDATE") do
        @offer.hiring_application.with_lock do
          @offer.with_lock do
            raise HiringOffer::Unavailable unless @offer.available?

            yield attributes
          end
        end
      end
    end

    def private_headers
      response.headers.merge!("Cache-Control" => "private, no-store", "Pragma" => "no-cache", "Referrer-Policy" => "no-referrer",
        "X-Content-Type-Options" => "nosniff", "X-Robots-Tag" => "noindex, nofollow", "X-Frame-Options" => "DENY")
    end
end
