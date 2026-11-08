# frozen_string_literal: true

class Api::V1::PayrollIndiaHandoffsController < Api::V1::PayrollBaseController
  before_action :set_payroll_run

  def index
    authorize @payroll_run, :india_handoffs?
    render_review
  end

  def create
    authorize @payroll_run, :manage_india_handoffs?
    workflow.create!(actor: current_user, employment_id: params[:employment_id], expected_digest: params[:expected_digest],
      accounts_email: params[:accounts_email], bank_confirmed: params[:bank_confirmed], expected_bank_digest: params[:expected_bank_digest])
    render_review(201)
  end

  def retry_delivery
    authorize @payroll_run, :manage_india_handoffs?
    workflow.retry!(actor: current_user, handoff_id: params[:id])
    render_review
  end

  def void
    authorize @payroll_run, :manage_india_handoffs?
    workflow.void!(actor: current_user, handoff_id: params[:id])
    render_review
  end

  def reconcile_delivery
    authorize @payroll_run, :record_india_credit?
    workflow.reconcile_delivery!(actor: current_user, handoff_id: params[:id], outcome: handoff_param(:outcome),
      evidence_reference: handoff_param(:evidence_reference), worker_stopped: handoff_param(:worker_stopped))
    render_review
  end

  def record_credit
    authorize @payroll_run, :record_india_credit?
    workflow.record_credit!(actor: current_user, handoff_id: params[:id], amount: handoff_param(:amount),
      credited_on: handoff_param(:credited_on), reference: handoff_param(:reference))
    render_review
  end

  private

    def handoff_param(key)
      input = params[:india_handoff]
      raise Payroll::MercuryPayment::Blocked.new("india_handoff_input_invalid") unless input.is_a?(ActionController::Parameters)

      input[key]
    end

    def workflow
      @workflow ||= Payroll::IndiaHandoff.new(@payroll_run)
    end

    def render_review(status = 200)
      render json: { india_handoffs: Payroll::IndiaHandoffReview.new(@payroll_run, current_user).call }, status:
    end
end
