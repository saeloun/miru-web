# frozen_string_literal: true

class Api::V1::BaseController < ActionController::Base
  include PunditConcern
  include ActionController::MimeResponds
  include ErrorHandler
  include CurrentCompanyConcern
  include Pagy::Backend
  include SetCurrentDetails
  include Authenticable

  skip_before_action :verify_authenticity_token
  before_action :authenticate_user!
  before_action :set_virtual_verified_invitations_allowed

  def not_found
    skip_authorization

    render json: { error: "Route not found" }, status: 404
  end

  def set_virtual_verified_invitations_allowed
    allowed_emails = ENV.fetch("VIRTUAL_VERIFIED_ADMIN_EMAILS", "")
      .split(",")
      .map(&:strip)
      .reject(&:blank?)
    @virtual_verified_invitations_allowed = current_user && allowed_emails.include?(current_user.email)
  end
end
