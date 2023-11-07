# frozen_string_literal: true

class InternalApi::V1::ApplicationController < ActionController::API
  include PunditConcern
  include ActionController::MimeResponds
  include ErrorHandler
  include Authenticable
  include CurrentCompanyConcern
  include Pagy::Backend
  include SetCurrentDetails

  before_action :authenticate_user!
  before_action :set_virtual_verified_invitations_allowed

  def not_found
    skip_authorization

    render json: { error: "Route not found" }, status: :not_found
  end

  def set_virtual_verified_invitations_allowed
    @virtual_verified_invitations_allowed = current_user &&
      ENV["VIRTUAL_VERIFIED_ADMIN_EMAILS"]&.include?(current_user.email)
  end
end
