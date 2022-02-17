# frozen_string_literal: true

module ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from ActionController::RoutingError, with: :handle_not_found_error
    rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  end

  private
    def handle_not_found_error(_error)
      message = exception.message || "The resource you're looking for is not available"

      respond_to do |format|
        format.json { render json: { errors: message }, status: :forbidden }
        format.html { render file: "public/401.html", status: :not_found, layout: false, alert: message }
      end
    end

    def user_not_authorized(exception)
      policy_name = exception.policy.class.to_s.underscore

      message = t "#{policy_name}.#{exception.query}", scope: "pundit", default: :default
      respond_to do |format|
        format.html { redirect_to root_path, alert: message }
        format.json { render json: { errors: message }, status: :forbidden  }
      end
    end
end
