# frozen_string_literal: true

module ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from ActionController::RoutingError, with: :handle_not_found_error
    rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found_error
  end

  private
    def handle_not_found_error(exception)
      message = exception.message || I18n.t("errors.not_found")

      respond_to do |format|
        format.json { render json: { errors: message }, status: :not_found }
        format.html { render file: "public/401.html", status: :not_found, layout: false, alert: message }
      end
    end
end
