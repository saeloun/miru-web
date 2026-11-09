# frozen_string_literal: true

class Api::V1::ConsultantInvoiceAuthorizationsController < Api::V1::ApplicationController
  include ActionController::RequestForgeryProtection
  self.allow_forgery_protection = ActionController::Base.allow_forgery_protection
  protect_from_forgery with: :exception, unless: :token_authenticated_request?
  prepend_before_action :prevent_caching
  before_action :verify_workspace

  FIELDS = %w[action expected_event_id statement_digest idempotency_key].freeze

  rescue_from ActionController::ParameterMissing, ActionController::BadRequest do
    render json: { errors: "Invalid invoice authorization parameters" }, status: 400
  end
  rescue_from Payroll::Workflow::NotAuthorized, Payroll::Entitlement::NotEnabled do |error|
    render json: { errors: error.message }, status: 403
  end
  rescue_from Payroll::Workflow::Conflict do |error|
    render json: { errors: error.message }, status: 409
  end
  rescue_from Payroll::ConsultantReview::InvalidInput do |error|
    render json: { errors: error.message }, status: 422
  end

  def show
    authorize employment, :show?, policy_class: ConsultantInvoiceAuthorizationPolicy
    render json: { invoice_authorization: service.summary(before_id: params[:before_id]) }
  end

  def create
    input = params.require(:invoice_authorization)
    unless input.is_a?(ActionController::Parameters) && input.keys.sort == FIELDS.sort && input.values.all? { |value| value.is_a?(String) }
      raise Payroll::ConsultantReview::InvalidInput, "Provide only the named authorization fields as text"
    end
    unless %w[grant withdraw].include?(input[:action])
      raise Payroll::ConsultantReview::InvalidInput, "Choose grant or withdraw"
    end
    authorize employment, :record?, policy_class: ConsultantInvoiceAuthorizationPolicy
    render json: { invoice_authorization: service.record!(**input.permit(*FIELDS).to_h.symbolize_keys) }, status: 201
  end

  private

    def prevent_caching
      response.headers["Cache-Control"] = "private, no-store"
      response.headers["Pragma"] = "no-cache"
      response.headers["X-Content-Type-Options"] = "nosniff"
    end

    def verify_workspace
      identity = params[:company_id]
      return if (identity.is_a?(String) || identity.is_a?(Integer)) && current_company &&
        identity.to_s == current_company.id.to_s && current_user.current_workspace_id == current_company.id

      skip_authorization
      render json: { errors: "Invoice authorization workspace changed; reload the current workspace" }, status: 409
    end

    def employment
      @employment ||= begin
        target = params[:user_id] || current_user.id
        unless (target.is_a?(String) || target.is_a?(Integer)) && target.to_s.match?(/\A[1-9]\d{0,18}\z/) && target.to_i <= 9_223_372_036_854_775_807
          raise ActionController::BadRequest
        end
        current_company.employments.kept.find_by!(user_id: target)
      end
    end

    def service
      Payroll::InvoiceAuthorization.new(employment, actor: current_user)
    end
end
