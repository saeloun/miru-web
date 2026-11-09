# frozen_string_literal: true

class Api::V1::PayrollPtoController < Api::V1::PayrollBaseController
  before_action -> { authorize PayrollRun, :index? }

  POLICY_FIELDS = %w[effective_on opening_on opening_hours monthly_accrual_hours accrual_day leave_year_month leave_year_day
    carry_rule rate_basis advance_limit_hours exception_threshold_hours negative_threshold_hours evidence reason idempotency_key].freeze
  DECISION_FIELDS = %w[period kind reason expected_digest idempotency_key origin_entry_id origin_component rate_amount rate_hours rate_reference allocations].freeze

  def show
    month = Payroll::ConsultantReview.period(params[:month], current_company.resolved_time_zone.today.iso8601,
      today: current_company.resolved_time_zone.today).first
    facts = Payroll::PtoFacts.new(employment, month:).call
    unless PayrollRunPolicy.new(current_user, PayrollRun).create? ||
        PayrollRun.where(company: current_company, period: month, accounts_reviewer: current_user).exists?
      raise Payroll::Workflow::NotAuthorized, "Only an assigned accounts reviewer or an active owner or admin can read this leave review"
    end
    policy = ConsultantPtoPolicy.find_by(id: facts["policy_id"])
    history = PayrollPtoEntry.where(employment:, company: current_company).includes(:actor).order(id: :desc).limit(100)
    obligations = Payroll::PtoObligations.new(employment, as_of: month.end_of_month).call
    render json: { facts:, policy: policy_details(policy), can_manage: PayrollRunPolicy.new(current_user, PayrollRun).create?,
      history: history.map { |entry| entry_details(entry) },
      cash_cases: Payroll::PtoReport.new(current_company, as_of: month.end_of_month).cash_cases(employment).map do |row|
        recovery = PayrollPtoRecovery.find_by(id: row[:recovery_id])
        row.merge(can_review_credit: recovery && recovery.kind == "returned_review" &&
          recovery.payroll_run.final_reviewer_id == current_user.id && recovery.payroll_run.eligible_actor?(current_user, "final"))
      end,
      obligations: obligations.map do |row|
        { origin_entry_id: row[:origin].id, origin_component: row[:component], period: row[:origin].period.iso8601, kind: row[:component],
          remaining_hours: (row[:remaining_minutes] / 60).to_s("F"), accrued_recovery_hours: (row[:accrued_recovery_minutes] / 60).to_s("F"),
          debt: row[:debt], review: row[:review]&.kind }
      end }
  end

  def policy
    record = ledger.configure!(**strict_payload(:pto_policy, POLICY_FIELDS))
    render json: { policy: policy_details(record) }, status: 201
  end

  def decisions
    input = strict_payload(:pto_decision, DECISION_FIELDS)
    record = if input[:origin_entry_id].present?
      ledger.review_obligation!(**input)
    elsif input.key?(:allocations)
      raise Payroll::ConsultantReview::InvalidInput, "Choose the explicit allocation treatment" unless input.delete(:kind) == "allocation"

      ledger.allocate!(**input)
    else
      ledger.decide!(**input)
    end
    render json: { entry: entry_details(record) }, status: 201
  rescue ArgumentError
    raise Payroll::ConsultantReview::InvalidInput, "Provide a complete explicit PTO decision", cause: nil
  end

  def accrue
    through = Date.iso8601(params[:through].to_s)
    ledger.accrue!(through:)
    render json: { posted_through: through.iso8601 }
  rescue Date::Error
    raise Payroll::ConsultantReview::InvalidInput, "Choose a valid accrual date", cause: nil
  end

  def resolve_credit_review
    review = PayrollPtoRecovery.where(company: current_company, employment:).find(params[:recovery_id])
    input = strict_payload(:pto_recovery_review, %w[reason expected_recovery_id])
    settled = Payroll::PtoRecovery.resolve_review!(review, actor: current_user, **input)
    render json: { recovery_id: settled.id, state: settled.kind }, status: 201
  rescue ArgumentError
    raise Payroll::ConsultantReview::InvalidInput, "Provide the exact recovery review and reason", cause: nil
  end

  def report
    authorize :consultant_payroll, :index?
    as_of = Date.iso8601(params[:as_of].to_s)
    unless (1900..2099).cover?(as_of.year) && as_of <= current_company.resolved_time_zone.today
      raise Payroll::ConsultantReview::InvalidInput, "Choose a completed or current review date"
    end
    render json: Payroll::PtoReport.new(current_company, as_of:).call
  rescue Date::Error
    raise Payroll::ConsultantReview::InvalidInput, "Choose a valid review date", cause: nil
  end

  private

    def employment
      @employment ||= current_company.employments.kept.find(params[:id])
    end

    def ledger
      Payroll::PtoLedger.new(employment, actor: current_user)
    end

    def strict_payload(key, fields)
      payload = params.require(key)
      unless payload.is_a?(ActionController::Parameters) && (payload.keys - fields).empty? && payload.except(:allocations).values.all? { |value| value.is_a?(String) }
        raise Payroll::ConsultantReview::InvalidInput, "Use only the named PTO fields; quantities are derived from the approved source"
      end
      if payload.key?(:allocations)
        parts = payload[:allocations]
        unless parts.is_a?(Array) && parts.all? { |part| part.is_a?(ActionController::Parameters) && part.keys.sort == %w[hours kind] && part.values.all? { |value| value.is_a?(String) } }
          raise Payroll::ConsultantReview::InvalidInput, "Provide named treatments with exact decimal hours"
        end
      end
      payload.permit(*(fields - ["allocations"]), allocations: [:kind, :hours]).to_h.symbolize_keys
    end

    def policy_details(policy)
      return nil unless policy

      values = policy.attributes.except("created_at", "updated_at", "created_by_id", "company_id", "employment_id")
        .transform_values { |value| value.is_a?(BigDecimal) ? value.to_s("F") : value }
      Payroll::PtoLedger::HOUR_FIELDS.each { |field| values["#{field}_hours"] = (policy.public_send("#{field}_minutes") / 60).to_s("F") }
      values
    end

    def entry_details(entry)
      { id: entry.id, origin_entry_id: entry.origin_entry_id, period: entry.period.iso8601, kind: entry.kind,
        hours: (entry.minutes / 60).to_s("F"), balance_delta_hours: (entry.balance_delta_minutes / 60).to_s("F"),
        cash_amount_minor: entry.cash_amount_minor.to_s, reason: entry.reason, actor_name: entry.actor.full_name,
        created_at: entry.created_at.iso8601, previous_entry_id: entry.previous_entry_id }
    end
end
