# frozen_string_literal: true

class Api::V1::ApplicationController < ActionController::API
  include PunditConcern
  include ActionController::MimeResponds
  include ErrorHandler
  include CurrentCompanyConcern
  include Pagy::Backend
  include SetCurrentDetails
  include Authenticable

  around_action :switch_locale
  before_action :authenticate_user!
  before_action :set_virtual_verified_invitations_allowed

  def not_found
    skip_authorization

    render json: { error: "Route not found" }, status: 404
  end

  def set_virtual_verified_invitations_allowed
    allowed_emails = ENV.fetch("VIRTUAL_VERIFIED_ADMIN_EMAILS", "")
      .split(/[,\s]+/)
      .map { |email| email.strip.downcase }
      .reject(&:blank?)
    @virtual_verified_invitations_allowed = current_user.present? &&
      allowed_emails.include?(current_user.email.to_s.downcase)
  end

  private

    def switch_locale(&action)
      locale = LocaleConfig.normalize(
        params[:locale].presence ||
        current_user&.locale.presence ||
        request.headers["X-Miru-Locale"].presence ||
        LocaleConfig.from_accept_language(request.headers["Accept-Language"])
      ).to_sym

      I18n.with_locale(locale, &action)
    end
end
