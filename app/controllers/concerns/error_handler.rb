# frozen_string_literal: true

module ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from ActionController::RoutingError, ActiveRecord::RecordNotFound, with: :handle_not_found_error
    rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
    rescue_from Discard::RecordNotDiscarded, with: :record_not_discarded
    rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
    rescue_from Pagy::VariableError, with: :invalid_param_value
  end

  private

    def handle_not_found_error(exception)
      message = exception.message || I18n.t("errors.not_found")

      respond_to do |format|
        format.json { render json: { errors: message }, status: 404 }
        format.html { render file: "public/404.html", status: 404, layout: false, alert: message }
      end
    end

    def user_not_authorized(exception)
      redirect_path = root_path
      policy = exception.policy
      policy_name = policy.class.to_s.underscore
      error_key = policy.try(:error_message_key) || exception.query

      message = I18n.t("#{policy_name}.#{error_key}", scope: "pundit", default: :default)
      case policy.try(:error_message_key)
      when :different_workspace
        message = I18n.t("client.update.failure.unauthorized")
      end

      respond_to do |format|
        format.html do
          flash.now[:alert] = message
          redirect_to redirect_path
        end
        format.json { render json: { errors: message }, status: 403 }
        format.any(:pdf, :csv) { render json: { errors: message }, status: 403 }
      end
    end

    def record_not_discarded(exception)
      message = exception.message

      respond_to do |format|
        format.json {
          render json: { errors: message, notice: I18n.t("errors.internal_server_error") },
            status: 500
        }
        format.html { render file: "public/500.html", status: 500, layout: false, alert: message }
      end
    end

    def record_invalid(exception)
      message = exception.message

      respond_to do |format|
        format.json {
          render json: {
                   errors: exception.record.errors.full_messages.first,
                   notice: I18n.t("client.update.failure.message")
                 },
            status: 422
        }
        format.html { render file: "public/422.html", status: 422, layout: false, alert: message }
      end
    end

    def invalid_param_value(exception)
      message = exception.message

      respond_to do |format|
        format.json { render json: { errors: message }, status: 400 }
        format.html { render file: "public/400.html", status: 400, layout: false, alert: message }
      end
    end
end
