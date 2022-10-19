# frozen_string_literal: true

class ApplicationController < ActionController::Base
  include DeviseWhitelist
  include PunditConcern
  include ErrorHandler
  include CurrentCompanyConcern
  include Pagy::Backend

  before_action :process_token, :validate_company!

  private

    def validate_company!
      return if current_user.nil? || devise_controller?

      authorize current_company, :company_present?, policy_class: CompanyPolicy
    end

    # Check for auth headers - if present, decode or send unauthorized response (called always to allow current_user)
    def process_token
      if request.headers["Authorization"].present?
        begin
          jwt_payload = JWT.decode(
            request.headers["Authorization"].split(" ")[1],
            Rails.application.secrets.secret_key_base).first
          @current_user_id = jwt_payload["id"]
        rescue JWT::ExpiredSignature, JWT::VerificationError, JWT::DecodeError
          head :unauthorized
        end
      end
    end

    # If user has not signed in, return unauthorized response (called only when auth is needed)
    def authenticate_user!(options = {})
      head :unauthorized unless signed_in?
    end

    # set Devise's current_user using decoded JWT instead of session
    def current_user
      @current_user ||= super || User.find(@current_user_id)
    end

    # check that authenticate_user has successfully returned @current_user_id (user is authenticated)
    def signed_in?
      @current_user_id.present?
    end
end
