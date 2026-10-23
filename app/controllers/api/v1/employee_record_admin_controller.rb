# frozen_string_literal: true

class Api::V1::EmployeeRecordAdminController < Api::V1::ApplicationController
  include ActionController::RequestForgeryProtection
  self.allow_forgery_protection = ActionController::Base.allow_forgery_protection
  protect_from_forgery with: :exception, unless: :token_authenticated_request?
  prepend_before_action :prevent_caching
  before_action :authorize_access

  rescue_from ActionController::ParameterMissing, ActionController::BadRequest do
    render json: { errors: "Invalid employee report parameters" }, status: 400
  end

  private

    def prevent_caching
      response.headers["Cache-Control"] = "private, no-store"
      response.headers["Pragma"] = "no-cache"
      response.headers["X-Content-Type-Options"] = "nosniff"
    end

    def authorize_access
      authorize EmployeeRecord, :manage?
      raise Pundit::NotAuthorizedError if current_company.id != current_user.current_workspace_id
    end

    def mutation_params(key, allowed)
      attributes = params.require(key)
      unless attributes.is_a?(ActionController::Parameters) && (attributes.keys - allowed).empty?
        raise ActionController::BadRequest
      end
      identity = attributes[:company_id]
      unless (identity.is_a?(String) || identity.is_a?(Integer)) && identity.to_s == current_company.id.to_s
        render json: { errors: "Employee records workspace changed; reload the current workspace" }, status: 409
      end
      attributes
    end
end
