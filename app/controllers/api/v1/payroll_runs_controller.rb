# frozen_string_literal: true

class Api::V1::PayrollRunsController < Api::V1::ApplicationController
  prepend_before_action :prevent_payroll_caching
  before_action :verify_payroll_workspace
  before_action :set_payroll_run, only: [:show, :preflight]

  def index
    authorize PayrollRun
    page = params[:page].to_s.match?(/\A[1-9]\d{0,4}\z/) ? params[:page].to_i : 1
    runs = policy_scope(PayrollRun).order(period: :desc, id: :desc).offset((page - 1) * 20).limit(21).to_a
    visible_runs = runs.first(20)
    revisions = PayrollRevision.where(payroll_run_id: visible_runs.map(&:id))
      .select("DISTINCT ON (payroll_run_id) id, payroll_run_id, number, digest, created_at")
      .order(:payroll_run_id, number: :desc).index_by(&:payroll_run_id)
    render json: {
      payroll_runs: visible_runs.map { |run| Payroll::ReviewSummary.new(run, revision: revisions[run.id]).summary },
      pagination: { page:, per_page: 20, has_more: runs.size > 20 }
    }
  end

  def show
    authorize @payroll_run
    render json: { payroll_run: Payroll::ReviewSummary.new(@payroll_run).detail }
  end

  def preflight
    authorize @payroll_run
    render json: { preflight: Payroll::ReviewSummary.new(@payroll_run).preflight }
  end

  private

    def set_payroll_run
      authorize PayrollRun, :index?
      @payroll_run = PayrollRun.where(company_id: payroll_workspace_id).find(params[:id])
    end

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

    def payroll_workspace_id
      @payroll_workspace_id ||= current_user.current_workspace_id
    end
end
