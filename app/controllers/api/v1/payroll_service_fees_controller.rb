# frozen_string_literal: true

class Api::V1::PayrollServiceFeesController < Api::V1::PayrollBaseController
  before_action -> { authorize PayrollRun, :index? }

  FIELDS = %w[period amount reason expected_digest expected_review_id idempotency_key].freeze

  def show
    render_period(service.summary(period: params[:period]))
  end

  def create
    input = params.require(:service_fee_review)
    unless input.is_a?(ActionController::Parameters) && input.keys.sort == FIELDS.sort && input.values.all? { |value| value.is_a?(String) }
      raise Payroll::ConsultantReview::InvalidInput, "Provide the named service-period fee fields as text; source quantities are derived by Miru"
    end
    render_period(service.record!(**input.permit(*FIELDS).to_h.symbolize_keys), status: 201)
  end

  private

    def service
      employment = current_company.employments.kept.find(params[:id])
      Payroll::ServiceFeeReview.new(employment, actor: current_user)
    end

    def render_period(data, status: 200)
      render json: { company_id: current_company.id, service_period: data }, status:
    end
end
