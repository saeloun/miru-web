# frozen_string_literal: true

module ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from ActionController::RoutingError, with: :handle_not_found_error
  end

  private
    def handle_not_found_error(_error)
      message = exception.message || "The resource you're looking for is not available"

      respond_to do |format|
        format.json { render json: { errors: message }, status: :forbidden }
        format.html { render file: "public/401.html", status: :not_found, layout: false, alert: message }
      end
    end
end
