# frozen_string_literal: true

module ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from ActionController::RoutingError, ActiveRecord::RecordNotFound, with: :handle_not_found_error
    rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  end

  private
    def handle_not_found_error(exception)
      message = exception.message || I18n.t("errors.not_found")

      respond_to do |format|
        format.json { render json: { errors: message }, status: :not_found }
        format.html { render file: "public/401.html", status: :not_found, layout: false, alert: message }
      end
    end

    def user_not_authorized(exception)
      redirect_path = root_path
      policy = exception.policy
      policy_name = policy.class.to_s.underscore
      error_key = policy.try(:error_message_key) || exception.query

      redirect_path = new_company_path if policy.try(:error_message_key) == :company_not_present

      message = t "#{policy_name}.#{error_key}", scope: "pundit", default: :default

      respond_to do |format|
        format.html { redirect_to redirect_path, alert: message }
        format.json { render json: { errors: message }, status: :forbidden  }
      end
    end
end
