# frozen_string_literal: true

class Api::V1::PayrollMercuryPaymentsController < Api::V1::PayrollBaseController
  before_action :set_payroll_run

  def index
    authorize @payroll_run, :mercury_payments?
    render json: { mercury_payments: Payroll::MercuryPaymentReview.new(@payroll_run, current_user).call }
  end

  def create
    authorize @payroll_run, :manage_mercury?
    payment.prepare!(actor: current_user, employment_id: params[:employment_id], expected_digest: params[:expected_digest].to_s,
      quote: params.permit(:mode, :reference_rate, :source, :observed_at).to_h.symbolize_keys)
    render_review(201)
  end

  def submit
    authorize @payroll_run, :manage_mercury?
    payment.submit!(actor: current_user, instruction_id: params[:id], expected_digest: leg_param(:expected_digest).to_s)
    render_review
  end

  def void
    authorize @payroll_run, :manage_mercury?
    payment.void!(actor: current_user, instruction_id: params[:id])
    render_review
  end

  def refresh
    authorize @payroll_run, :mercury_payments?
    reconciliation.refresh!(actor: current_user, instruction_id: params[:id])
    render_review
  end

  def reconcile
    authorize @payroll_run, :manage_mercury?
    result = reconciliation.reconcile!(actor: current_user, instruction_id: params[:id])
    render_review(200, reconcile: result.slice(:outcome, :candidates))
  end

  def confirm_request
    authorize @payroll_run, :manage_mercury?
    reconciliation.confirm_request!(actor: current_user, instruction_id: params[:id], request_id: leg_param(:request_id))
    render_review
  end

  def attest_absence
    authorize @payroll_run, :mercury_payments?
    reconciliation.attest_absence!(actor: current_user, instruction_id: params[:id], evidence_reference: leg_param(:evidence_reference))
    render_review
  end

  def record_credit
    authorize @payroll_run, :mercury_payments?
    reconciliation.record_credit!(actor: current_user, instruction_id: params[:id], amount: leg_param(:amount),
      credited_on: leg_param(:credited_on), reference: leg_param(:reference))
    render_review
  end

  def resolve_shortfall
    authorize @payroll_run, :mercury_payments?
    reconciliation.resolve_shortfall!(actor: current_user, instruction_id: params[:id], reason: leg_param(:reason))
    render_review
  end

  private

    def leg_param(key)
      params.dig(:mercury_payment, key) || params[key]
    end

    def payment
      Payroll::MercuryPayment.new(@payroll_run)
    end

    def reconciliation
      Payroll::MercuryReconciliation.new(@payroll_run)
    end

    def render_review(status = 200, extra = {})
      render json: { mercury_payments: Payroll::MercuryPaymentReview.new(@payroll_run, current_user).call }.merge(extra), status:
    end
end
