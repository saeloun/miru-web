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

  def not_found
    skip_authorization

    render json: { error: "Route not found" }, status: :not_found
  end
end
