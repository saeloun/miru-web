# frozen_string_literal: true

class Api::V1::PayrollProfileCompletionRequestsController < Api::V1::PayrollBaseController
  wrap_parameters false
  before_action :set_payroll_run

  # Accept only the source-bound command; callers cannot supply recipients or mail content.
  def create
    authorize @payroll_run, :profile_completion_requests?
    attributes = params.permit(:employment_id, :expected_digest, :idempotency_key)
    unless params.except(:company_id, :payroll_run_id, :controller, :action, :format, :authenticity_token).keys.sort == attributes.keys.sort
      raise Payroll::ConsultantReview::InvalidInput, "Recipients and requested details are determined by the current payroll profile"
    end
    request = Payroll::ProfileCompletion.new(@payroll_run, actor: current_user).create!(
      employment_id: attributes[:employment_id], expected_digest: attributes[:expected_digest], idempotency_key: attributes[:idempotency_key])
    render json: { profile_completion_request: request.receipt }, status: 202
  end
end
