# frozen_string_literal: true

class Payroll::ServiceFeeReview
  def initialize(employment, actor:)
    @employment, @actor = employment, actor
    @company = employment.company
  end

  def summary(period:)
    month = parse_period(period)
    authorize!(month)
    facts = Payroll::ServicePeriod.new(@employment, month:)
    row = facts.review
    { period: month.strftime("%Y-%m"), required: facts.required?, context: facts.context, digest: facts.digest, blockers: facts.blockers,
      current_review: row && review_details(row, facts) }
  end

  def record!(period:, amount:, reason:, expected_digest:, expected_review_id:, idempotency_key:)
    month = parse_period(period)
    authorize!(month)
    values = command_values(month, amount, reason, expected_digest, expected_review_id, idempotency_key)
    recorded = ApplicationRecord.transaction do
      runs = PayrollRun.where(company: @company).where("period >= ?", month).order(:id).lock.to_a
      @employment.with_lock do
        authorize!(month)
        append_review!(month, values, idempotency_key, runs)
      end
    end
    facts = Payroll::ServicePeriod.new(@employment, month:)
    summary(period:).merge(recorded_review: review_details(recorded, facts))
  end

  private

    def command_values(month, amount, reason, expected_digest, expected_review_id, idempotency_key)
      unless amount.is_a?(String) && amount.match?(Payroll::ConsultantRevision::AMOUNT_FORMAT) && amount.to_d.positive? &&
        amount.to_d < 1_000_000_000_000 && reason.is_a?(String) && reason.strip.length.between?(1, 1000) &&
        expected_digest.is_a?(String) && expected_digest.match?(/\A[0-9a-f]{64}\z/) && expected_review_id.is_a?(String) &&
        (expected_review_id.empty? || expected_review_id.match?(/\A[1-9]\d*\z/)) && idempotency_key.is_a?(String) && idempotency_key.length.between?(1, 128)
        raise Payroll::ConsultantReview::InvalidInput, "Provide an exact positive service-period fee, reason and current source"
      end
      { period: month, amount_minor: (amount.to_d * 100).to_i, reason:, source_digest: expected_digest, previous_review_id: expected_review_id.presence&.to_i }
    end

    def append_review!(month, values, idempotency_key, runs)
      existing = reviews.find_by(idempotency_key:)
      if existing
        unless existing.actor_id == @actor.id && values.all? { |key, value| existing.public_send(key) == value }
          raise Payroll::Workflow::Conflict, "Service fee command was already used"
        end
        return existing
      end
      facts = Payroll::ServicePeriod.new(@employment, month:)
      unless facts.blockers.empty? && facts.digest == values[:source_digest] && facts.review&.id == values[:previous_review_id]
        raise Payroll::Workflow::Conflict, "Service period changed; refresh before reviewing"
      end
      if runs.any? { |run| protected_activity?(run) }
        raise Payroll::Workflow::Conflict, "Bank activity protects the reviewed service-period fee"
      end
      origin = protect_pto_history!(month, runs)
      release_unsubmitted_recoveries!(runs, origin)
      reviews.create!(company: @company, employment: @employment, actor: @actor, idempotency_key:, context: facts.context, **values)
    end

    def protect_pto_history!(month, runs)
      entry = PayrollPtoEntry.heads.find_by(company: @company, employment: @employment, period: month, case_key: "month:#{month.iso8601}")
      return unless entry

      recovery = PayrollPtoRecovery.heads.find_by(payroll_pto_entry: entry)
      if recovery && (recovery.kind != "released" && (recovery.kind != "reserved" || runs.none? { |run| run.id == recovery.payroll_run_id })) || PayrollPtoAllocation.exists?(origin_entry: entry) ||
          PayrollPtoEntry.heads.exists?(origin_entry: entry, kind: %w[review_unpaid review_waive review_advance])
        raise Payroll::Workflow::Conflict, "PTO history already uses this fee basis; preserve its original period"
      end
      entry
    end

    def release_unsubmitted_recoveries!(runs, origin)
      return unless origin

      runs.each do |run|
        Payroll::PtoRecovery.reservations(run).where(employment: @employment, payroll_pto_entry: origin).order(:id).lock.each do |recovery|
          Payroll::PtoRecovery.append(recovery, "released")
        end
      end
    end

    def reviews
      ConsultantServiceFeeReview.where(company: @company, employment: @employment)
    end

    def review_details(row, facts)
      { id: row.id.to_s, amount: (row.amount_minor.to_d / 100).to_s("F"), reason: row.reason, source_digest: row.source_digest,
        current: facts.current_review&.id == row.id, previous_review_id: row.previous_review_id&.to_s }
    end

    def parse_period(value)
      raise Date::Error unless value.is_a?(String) && value.match?(/\A(?:19|20)\d{2}-(?:0[1-9]|1[0-2])\z/)

      month = Date.iso8601("#{value}-01")
      raise Date::Error if month > @company.resolved_time_zone.today.beginning_of_month

      month
    rescue Date::Error
      raise Payroll::ConsultantReview::InvalidInput, "Choose a current or completed service month", cause: nil
    end

    def authorize!(month)
      Payroll::Entitlement.require!(@company.id)
      active = @actor && User.kept.exists?(id: @actor.id, current_workspace_id: @company.id) &&
        @actor.employments.kept.where(company: @company, joined_at: ..@company.resolved_time_zone.today)
          .where("resigned_at IS NULL OR resigned_at >= ?", @company.resolved_time_zone.today).exists?
      roles = active && @actor.roles.where(resource: @company, name: %w[owner admin]).exists?
      assigned = active && reviewable_subject?(month) &&
        PayrollRun.where(company: @company, period: month, accounts_reviewer: @actor).any? { |run| PayrollRunPolicy.new(@actor, run).revisions? }
      raise Payroll::Workflow::NotAuthorized, "An active owner, admin or assigned accounts reviewer is required" unless active && (roles || assigned)
    end

    def reviewable_subject?(month)
      @company.employments.kept.joins(:consultant_compensations).where(id: @employment.id)
        .where("employments.joined_at IS NULL OR employments.joined_at <= ?", month.end_of_month)
        .where("employments.resigned_at IS NULL OR employments.resigned_at >= ?", month).exists?
    end

    def protected_activity?(run)
      PayrollIndiaHandoff.active.exists?(payroll_run: run, employment: @employment) ||
        PayrollPaymentGroup.where(payroll_run: run, employment: @employment).any? { |group| group.in_flight_legs.exists? }
    end
end
