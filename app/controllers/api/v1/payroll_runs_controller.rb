# frozen_string_literal: true

class Api::V1::PayrollRunsController < Api::V1::PayrollBaseController
  before_action :set_payroll_run, only: [:show, :preflight, :preparation, :revisions, :approvals]

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
      pagination: { page:, per_page: 20, has_more: runs.size > 20 },
      preparation: preparation_options
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

  def create
    authorize PayrollRun
    company = Company.find(payroll_workspace_id)
    today = company.resolved_time_zone.today
    month, = Payroll::ConsultantReview.period(params[:month], today.iso8601, today:)
    run = PayrollRun.create!(company:, period: month, currency: "INR",
      accounts_reviewer: reviewer(params[:accounts_reviewer_id]), final_reviewer: reviewer(params[:final_reviewer_id]))
    render json: { payroll_run: { id: run.id.to_s } }, status: 201
  rescue ActiveRecord::RecordNotUnique
    render json: { errors: "A payroll run already exists for this month" }, status: 409
  end

  def preparation
    authorize @payroll_run
    company = @payroll_run.company
    cutoff = params[:cutoff].presence || company.resolved_time_zone.today.iso8601
    revision = @payroll_run.current_revision
    render json: {
      can_prepare: PayrollRunPolicy.new(current_user, @payroll_run).revisions?, cutoff:, current_digest: revision&.digest,
      consultants: Payroll::ConsultantRevision.new(@payroll_run, actor: current_user).preparation(cutoff:)
    }
  end

  def revisions
    authorize @payroll_run
    revision = Payroll::ConsultantRevision.new(@payroll_run, actor: current_user).create!(
      consultants: revision_consultants, cutoff: params[:cutoff], expected_digest: params[:expected_digest].presence,
      idempotency_key: params[:idempotency_key].to_s
    )
    render json: { revision: { number: revision.number, digest: revision.digest } }, status: 201
  end

  def approvals
    authorize @payroll_run
    Payroll::Workflow.new(@payroll_run).approve!(actor: current_user, stage: params[:stage].to_s, expected_digest: params[:expected_digest].to_s)
    render json: { status: Payroll::Workflow.new(@payroll_run).status }, status: 201
  end

  private

    def reviewer(id)
      User.joins(:employments).where(employments: { company_id: payroll_workspace_id }).find(id)
    end

    def preparation_options
      return { can_create: false } unless PayrollRunPolicy.new(current_user, PayrollRun).create?

      company = Company.find(payroll_workspace_id)
      template = PayrollRun.new(company:, period: company.resolved_time_zone.today.beginning_of_month)
      staff = company.employments.kept.includes(:user).map(&:user).uniq
      { can_create: true, accounts_reviewers: reviewer_choices(staff, template, "accounts"), final_reviewers: reviewer_choices(staff, template, "final") }
    end

    def reviewer_choices(staff, template, stage)
      staff.filter_map { |user| { id: user.id.to_s, name: user.full_name } if template.eligible_actor?(user, stage) }
    end

    # Preserve literal consent; boolean casting accepts negative text such as "no".
    def revision_consultants
      Array(params[:consultants]).map do |entry|
        raise Payroll::ConsultantReview::InvalidInput, "Invalid consultant selection" unless entry.is_a?(ActionController::Parameters)

        values = entry.permit(:employment_id, :confirmed_unpaid_hours, :unpaid_reason, :acknowledged, :other_earning, :other_deduction, :withholding, expense_ids: [])
        values.to_h.symbolize_keys
      end
    end
end
