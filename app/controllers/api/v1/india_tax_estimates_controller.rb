# frozen_string_literal: true

class Api::V1::IndiaTaxEstimatesController < Api::V1::ApplicationController
  include ActionController::RequestForgeryProtection
  self.allow_forgery_protection = ActionController::Base.allow_forgery_protection
  protect_from_forgery with: :exception, only: :create, unless: :token_authenticated_request?
  prepend_before_action do
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["Pragma"] = "no-cache"
  end
  rescue_from IndiaTax::SalaryEstimate::InvalidInput do |error|
    render json: { errors: error.message }, status: 422
  end
  rescue_from ActionController::ParameterMissing do
    render json: { errors: "Provide a tax_estimate object" }, status: 400
  end
  rescue_from ActionController::InvalidAuthenticityToken do
    render json: { errors: "Session verification failed. Reload before calculating tax." }, status: 422
  end

  def index
    authorize TaxDeclaration, :estimate?
    render json: {
      periods: IndiaTax::SalaryEstimate::PERIODS.map { |value, period| { value:, label: period["label"] } },
      age_groups: IndiaTax::SalaryEstimate::AGE_EXEMPTIONS.keys,
      currency: "INR", sources: IndiaTax::SalaryEstimate::SOURCES
    }
  end

  def create
    authorize TaxDeclaration, :estimate?
    # Preserve unknown tax fields so the strict calculator rejects rather than drops them.
    input = params.expect(tax_estimate: {})
    unless input[:company_id].to_s == current_company.id.to_s
      return render json: { errors: "Workspace changed. Reload before calculating tax." }, status: 409
    end
    result = IndiaTax::SalaryEstimate.new(input.except(:company_id).to_h).call
    render json: { estimate: result }
  end
end
