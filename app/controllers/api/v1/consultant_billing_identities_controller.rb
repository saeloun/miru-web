# frozen_string_literal: true

class Api::V1::ConsultantBillingIdentitiesController < Api::V1::ApplicationController
  include ActionController::RequestForgeryProtection
  self.allow_forgery_protection = ActionController::Base.allow_forgery_protection
  protect_from_forgery with: :exception, unless: :token_authenticated_request?
  prepend_before_action :prevent_caching
  before_action :verify_workspace

  SUBMISSION_FIELDS = (Payroll::BillingFacts::FIELDS + %w[expected_submission_id idempotency_key reuse_pan_evidence reuse_gst_evidence pan_evidence gst_evidence]).freeze
  REVIEW_FIELDS = %w[submission_id expected_review_id decision reason manual_tax_reviewed missing_pan_acknowledged idempotency_key].freeze

  rescue_from ActionController::ParameterMissing, ActionController::BadRequest do
    render json: { errors: "Invalid billing identity parameters" }, status: 400
  end
  rescue_from Payroll::Workflow::NotAuthorized, Payroll::Entitlement::NotEnabled do
    render json: { errors: "Billing identity access is unavailable in this workspace" }, status: 403
  end
  rescue_from Payroll::Workflow::Conflict do
    render json: { errors: "Billing identity or evidence changed; refresh before continuing" }, status: 409
  end
  rescue_from Payroll::ConsultantReview::InvalidInput do |error|
    render json: { errors: error.message }, status: 422
  end
  rescue_from ActiveRecord::RecordInvalid, ActiveRecord::StatementInvalid, ActiveStorage::Error do
    render json: { errors: "Billing identity could not be saved or its evidence is unavailable" }, status: 422
  end

  def show
    authorize employment, :show?, policy_class: ConsultantBillingIdentityPolicy
    render json: { billing_identity: service.summary(before_id: params[:before_id], review_before_id: params[:review_before_id], submission_id: params[:submission_id]) }
  end

  def create
    input = input!(:billing_identity, SUBMISSION_FIELDS)
    strings = Payroll::BillingFacts::FIELDS + %w[expected_submission_id idempotency_key]
    raise Payroll::ConsultantReview::InvalidInput, "Provide the complete named billing facts as text" unless strings.all? { |key| input[key].is_a?(String) }
    authorize employment, :record_submission?, policy_class: ConsultantBillingIdentityPolicy
    result = service.submit!(facts: input.permit(*Payroll::BillingFacts::FIELDS).to_h, expected_submission_id: input[:expected_submission_id], idempotency_key: input[:idempotency_key],
      pan_evidence: input[:pan_evidence], gst_evidence: input[:gst_evidence], reuse_pan_evidence: boolean!(input[:reuse_pan_evidence]), reuse_gst_evidence: boolean!(input[:reuse_gst_evidence]))
    render json: { billing_identity: result }, status: 201
  end

  def review
    input = input!(:billing_review, REVIEW_FIELDS)
    unless input.keys.sort == REVIEW_FIELDS.sort && input.except(:manual_tax_reviewed, :missing_pan_acknowledged).values.all? { |value| value.is_a?(String) } &&
        [true, false].include?(input[:manual_tax_reviewed]) && [true, false].include?(input[:missing_pan_acknowledged])
      raise Payroll::ConsultantReview::InvalidInput, "Provide the exact named review fields and explicit boolean acknowledgements"
    end
    authorize employment, :review?, policy_class: ConsultantBillingIdentityPolicy
    render json: { billing_identity: service.review!(**input.permit(*REVIEW_FIELDS).to_h.symbolize_keys) }, status: 201
  end

  def download
    authorize employment, :show?, policy_class: ConsultantBillingIdentityPolicy
    bytes, type, filename = service.download(submission_id: params[:submission_id], kind: params[:kind])
    with_download_workspace do
      authorize employment, :show?, policy_class: ConsultantBillingIdentityPolicy
      send_data bytes, type:, filename:, disposition: "attachment"
    end
  end

  private

    def input!(key, fields)
      input = params.require(key)
      unless input.is_a?(ActionController::Parameters) && (input.keys - fields).empty?
        raise Payroll::ConsultantReview::InvalidInput, "Provide only the named billing identity fields"
      end
      input
    end

    def boolean!(value)
      return true if value == true || value == "true"
      return false if value == false || value == "false" || value.nil?

      raise Payroll::ConsultantReview::InvalidInput, "Choose explicit evidence reuse"
    end

    def prevent_caching
      response.headers["Cache-Control"] = "private, no-store"
      response.headers["Pragma"] = "no-cache"
      response.headers["X-Content-Type-Options"] = "nosniff"
    end

    def verify_workspace
      identity = params[:company_id]
      return if (identity.is_a?(String) || identity.is_a?(Integer)) && current_company && identity.to_s == current_company.id.to_s && current_user.current_workspace_id == current_company.id

      skip_authorization
      render json: { errors: "Billing identity workspace changed; reload the current workspace" }, status: 409
    end

    def employment
      @employment ||= begin
        id = params[:user_id] || current_user.id
        unless (id.is_a?(String) || id.is_a?(Integer)) && id.to_s.match?(/\A[1-9]\d{0,18}\z/) && id.to_i <= 9_223_372_036_854_775_807
          raise ActionController::BadRequest
        end
        current_company.employments.kept.find_by!(user_id: id)
      end
    end

    def service
      Payroll::BillingIdentity.new(employment, actor: current_user)
    end
end
