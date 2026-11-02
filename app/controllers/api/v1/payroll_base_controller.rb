# frozen_string_literal: true

class Api::V1::PayrollBaseController < Api::V1::ApplicationController
  include ActionController::RequestForgeryProtection
  self.allow_forgery_protection = ActionController::Base.allow_forgery_protection

  protect_from_forgery with: :exception, unless: :token_authenticated_request?
  prepend_before_action :prevent_payroll_caching
  before_action :verify_payroll_workspace
  before_action :require_workspace_on_write, unless: -> { request.get? }

  rescue_from Payroll::Entitlement::NotEnabled do |error|
    render json: { errors: error.message }, status: 403
  end
  rescue_from Payroll::Workflow::NotAuthorized do |error|
    render json: { errors: error.message }, status: 403
  end
  rescue_from Payroll::Workflow::Conflict do |error|
    render json: { errors: error.message }, status: 409
  end
  rescue_from Payroll::MercuryPayment::Blocked do |error|
    render json: { errors: "This action is blocked", codes: error.codes }, status: 422
  end
  rescue_from Payroll::ConsultantReview::InvalidInput do |error|
    render json: { errors: error.message }, status: 422
  end
  rescue_from ActiveRecord::RecordInvalid do |error|
    render json: { errors: error.record.errors.full_messages.to_sentence }, status: 422
  end

  private

    def prevent_payroll_caching
      response.headers["Cache-Control"] = "private, no-store"
      response.headers["Pragma"] = "no-cache"
    end

    def verify_payroll_workspace
      if params[:company_id].present? && params[:company_id].to_s != payroll_workspace_id.to_s
        authorize PayrollRun, :index?
        render json: { errors: "Payroll workspace changed; reload the current workspace" }, status: 409
      end
    end

    def require_workspace_on_write
      return if params[:company_id].present?

      authorize PayrollRun, :index?
      render json: { errors: "Payroll workspace changed; reload the current workspace" }, status: 409
    end

    def payroll_workspace_id
      @payroll_workspace_id ||= current_user.current_workspace_id
    end

    def set_payroll_run
      authorize PayrollRun, :index?
      @payroll_run = PayrollRun.where(company_id: payroll_workspace_id).find(params[:payroll_run_id] || params[:id])
    end
end
