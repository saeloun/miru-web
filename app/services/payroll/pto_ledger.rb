# frozen_string_literal: true

module Payroll
  class PtoLedger
    DECISIONS = %w[paid unpaid advance defer waive correction].freeze
    HOUR_FIELDS = %w[opening monthly_accrual advance_limit exception_threshold negative_threshold].freeze

    def initialize(employment, actor:)
      @employment, @actor = employment, actor
      @company = employment.company
    end

    def configure!(**input)
      attributes = input.stringify_keys
      on = iso_date(attributes.fetch("effective_on"))
      synchronize(on) do
        values = policy_values(attributes, on)
        candidate = policies.new(values.merge(company: @company, employment: @employment, created_by: @actor))
        existing = policies.find_by(idempotency_key: attributes["idempotency_key"])
        if existing
          return existing if candidate.attributes.except("id", "created_at", "updated_at") == existing.attributes.except("id", "created_at", "updated_at")
          raise Workflow::Conflict, "Policy command was already used"
        end
        first = policies.order(:id).first
        validate_policy!(values, on, first)
        candidate.save!
        record_opening!(candidate) if !first && candidate.opening_minutes.negative?
        candidate
      end
    rescue KeyError, Date::Error
      raise ConsultantReview::InvalidInput, "Complete the effective policy and reconciled opening fields", cause: nil
    end

    def decide!(period:, kind:, reason:, expected_digest:, idempotency_key:)
      apply_allocation!(period:, kind:, reason:, expected_digest:, idempotency_key:)
    end

    def allocate!(period:, allocations:, reason:, expected_digest:, idempotency_key:)
      apply_allocation!(period:, kind: "allocation", allocations:, reason:, expected_digest:, idempotency_key:)
    end

    def apply_allocation!(period:, kind:, reason:, expected_digest:, idempotency_key:, allocations: nil)
      month, canonical_parts, command_digest = allocation_command(period, kind, reason, expected_digest, allocations)
      Entitlement.require!(@company.id)
      authorize!
      existing = command_replay(idempotency_key, command_digest, "PTO command was already used for different approved allocations")
      return existing if existing

      synchronize(month) do
        facts = PtoFacts.new(@employment, month:).call
        existing = command_replay(idempotency_key, command_digest, "PTO command was already used for different facts")
        return existing if existing
        raise Workflow::Conflict, "PTO facts changed; refresh before deciding" unless facts["digest"] == expected_digest
        values = allocation_values(facts, month, kind, canonical_parts, command_digest)
        entries.create!(values.merge(company: @company, employment: @employment, actor: @actor, reason:, idempotency_key:))
      end
    end

    # Overlapping retries can both miss the replay check before either decision commits.
    def review_obligation!(origin_entry_id:, period:, kind:, reason:, expected_digest:, idempotency_key:, **options)
      options.assert_valid_keys(:rate_amount, :rate_hours, :rate_reference, :origin_component)
      month = historical_month(period, kind)
      Entitlement.require!(@company.id)
      authorize!
      command_digest = Digest::SHA256.hexdigest(JSON.generate([origin_entry_id.to_s, month.iso8601, kind, reason,
        expected_digest, *options.values_at(:rate_amount, :rate_hours, :rate_reference, :origin_component)]))
      existing = command_replay(idempotency_key, command_digest, "PTO command was already used for a different historical decision")
      return existing if existing
      synchronize(month) do
        facts = PtoFacts.new(@employment, month:).call
        existing = command_replay(idempotency_key, command_digest, "PTO command was already used for a different historical decision")
        return existing if existing
        raise Workflow::Conflict, "PTO facts changed; refresh before deciding" unless facts["digest"] == expected_digest

        context = obligation_context!(origin_entry_id, month, kind, options[:origin_component])
        values = historical_values(facts, context, month, kind, options, command_digest)
        entries.create!(values.merge(company: @company, employment: @employment, actor: @actor, reason:, idempotency_key:))
      end
    end

    def accrue!(through:, scheduled: false)
      first = policies.order(:effective_on, :id).first
      return unless first
      raise ConsultantReview::InvalidInput, "Accrual cannot be posted in the future" if through > @company.resolved_time_zone.today

      month = first.opening_on.beginning_of_month
      while month <= through.beginning_of_month
        key = "accrual:#{month.iso8601}"
        unless entries.exists?(case_key: key)
          # Earned credits append to the ledger; accepted bank reports keep their frozen entitlement.
          synchronize(month, require_current_workspace: !scheduled, protect_bank_activity: false) do
            policy = policies.where(effective_on: ..month).order(effective_on: :desc, id: :desc).first
            if policy&.accrual_eligible?(month, through:) && !entries.exists?(case_key: key)
              post_accrual!(policy, month, key)
            end
          end
        end
        month = month.next_month
      end
    end

    private

      # Historical debt requires an explicit recovery treatment rather than ordinary paid leave.
      def historical_month(period, kind)
        month = period.is_a?(Date) ? period : iso_date(period)
        unless month.day == 1 && %w[unpaid advance defer waive correction].include?(kind)
          raise ConsultantReview::InvalidInput, "Choose an explicit historical treatment and recovery month"
        end
        month
      end

      def allocation_command(period, kind, reason, expected_digest, allocations)
        month = period.is_a?(Date) ? period : iso_date(period)
        raise ConsultantReview::InvalidInput, "Choose a month and explicit PTO decision" unless month.day == 1 && (DECISIONS + ["allocation"]).include?(kind)

        canonical_parts = allocations ? canonical_allocations(allocations) : nil
        command_digest = Digest::SHA256.hexdigest(JSON.generate([month.iso8601, kind, reason, expected_digest, canonical_parts]))
        [month, canonical_parts, command_digest]
      end

      def policy_values(attributes, on)
        values = attributes.except(*HOUR_FIELDS.map { |field| "#{field}_hours" })
        HOUR_FIELDS.each { |field| values["#{field}_minutes"] = minutes(attributes.fetch("#{field}_hours"), signed: field == "opening") }
        values["effective_on"] = on
        values["opening_on"] = iso_date(attributes.fetch("opening_on"))
        values
      end

      def validate_policy!(values, on, first)
        if first.nil? && values["opening_on"] != on
          raise ConsultantReview::InvalidInput, "The initial policy must start at its reconciled opening date"
        end
        if first && (values["opening_on"] != first.opening_on || values["opening_minutes"] != first.opening_minutes)
          raise ConsultantReview::InvalidInput, "Opening is reconciled once; append a reviewed case correction instead of resetting history"
        end
        if entries.where(kind: "accrual", period: on..).exists?
          raise Workflow::Conflict, "Earned accrual already exists; apply policy changes after its posted period"
        end
        if values["opening_on"] > on || values["opening_on"].day != 1 || on.day != 1
          raise ConsultantReview::InvalidInput, "Opening and policy must start on a month boundary"
        end
      end

      def record_opening!(policy)
        entries.create!(company: @company, employment: @employment, consultant_pto_policy: policy, actor: @actor,
          period: policy.opening_on, case_key: "opening:#{policy.opening_on.iso8601}", kind: "opening",
          minutes: -policy.opening_minutes, debt_minutes: -policy.opening_minutes, balance_delta_minutes: 0,
          source_digest: Digest::SHA256.hexdigest("opening:#{policy.id}"), reason: policy.reason, idempotency_key: "opening:#{policy.id}")
      end

      def command_replay(idempotency_key, command_digest, message)
        existing = entries.find_by(idempotency_key:)
        return unless existing
        return existing if existing.rate_basis["command_digest"] == command_digest

        raise Workflow::Conflict, message
      end

      def allocation_values(facts, month, kind, canonical_parts, command_digest)
        policy = allocation_policy(facts)
        previous = entries.heads.find_by(case_key: "month:#{month.iso8601}")
        protect_recovery!(previous)
        quantity = facts.fetch("gap_minutes").to_d
        parts = approved_parts(canonical_parts, quantity, kind, previous)
        totals = parts.to_h { |part| [part.fetch("kind"), part.fetch("minutes").to_d] }
        zero = 0.to_d
        paid, advance = totals.fetch("paid", zero), totals.fetch("advance", zero)
        available = facts.fetch("closing_minutes").to_d - (previous&.balance_delta_minutes || 0)
        validate_balance!(paid, advance, available, policy)
        protect_later_debits!(previous, month, -paid - advance)
        { consultant_pto_policy: policy, previous_entry: previous, period: month, case_key: "month:#{month.iso8601}", kind:, minutes: quantity,
          allocations: parts, rate_basis: { "command_digest" => command_digest, "origin_compensation_id" => facts["compensation_id"],
            "origin_amount" => facts["period_base_fee"] || facts["monthly_fee"], "origin_hours" => facts["expected_hours"],
            "origin_period" => month.iso8601, "origin_source_digest" => facts.fetch("attendance_digest") }.tap do |basis|
              basis["service_fee_review"] = facts["service_fee_review"] if facts["service_fee_review"]
            end,
          debt_minutes: borrowed_minutes(advance, available - paid), balance_delta_minutes: -paid - advance,
          source_digest: facts.fetch("attendance_digest") }
      end

      def allocation_policy(facts)
        if facts["service_fee_review_required"]
          raise ConsultantReview::InvalidInput, "Review the service-period fee before deciding PTO"
        end
        policy = policies.find_by(id: facts["policy_id"])
        raise ConsultantReview::InvalidInput, "Configure an approved PTO policy first" unless policy

        policy
      end

      def approved_parts(canonical_parts, quantity, kind, previous)
        return [] if quantity.zero? && previous && kind == "correction" && canonical_parts.nil?
        raise ConsultantReview::InvalidInput, "No missing scheduled hours require a decision" unless quantity.positive?

        canonical_parts ? resolve_allocations(canonical_parts, quantity) : [{ "kind" => kind, "minutes" => quantity.to_s("F") }]
      end

      def validate_balance!(paid, advance, available, policy)
        if paid > [available, 0.to_d].max
          raise ConsultantReview::InvalidInput, "Paid PTO exceeds the approved available balance; choose advance or another explicit treatment"
        end
        if advance.positive? && available - paid - advance < -policy.advance_limit_minutes
          raise ConsultantReview::InvalidInput, "Advance exceeds the configured limit"
        end
      end

      def borrowed_minutes(quantity, available)
        zero = 0.to_d
        [quantity, [quantity - [available, zero].max, zero].max].min
      end

      def obligation_context!(origin_entry_id, month, kind, origin_component)
        origin = entries.find(origin_entry_id)
        validate_review_period!(origin, month)
        obligations = PtoObligations.new(@employment, as_of: month.end_of_month).call
        component = origin_component.presence || inferred_component!(origin, obligations)
        previous = entries.heads.find_by(case_key: "review:#{origin.id}:#{component}")
        protect_recovery!(previous)
        protect_historical_replacement!(previous, month, kind)
        obligation = PtoObligations.new(@employment, as_of: month.end_of_month).call(excluding_review: previous)
          .find { |row| row[:origin].id == origin.id && row[:component] == component }
        raise Workflow::Conflict, "This obligation has already been resolved or recovered" unless obligation

        verify_origin_attendance!(origin, kind)
        { origin:, previous:, obligation:, component: }
      end

      def inferred_component!(origin, obligations)
        components = origin.approved_allocations.pluck("kind") & %w[defer correction]
        components << (origin.kind == "opening" ? "opening" : "advance") if origin.debt_minutes.positive?
        if components.one? && obligations.any? { |row| row[:origin].id == origin.id && row[:component] == components.first }
          return components.first
        end

        raise ConsultantReview::InvalidInput, "Choose the explicit original PTO component for this historical review"
      end

      def validate_review_period!(origin, month)
        raise ConsultantReview::InvalidInput, "Review cannot precede its original case" if origin.period > month
        if origin.period == month && origin.kind != "opening"
          raise ConsultantReview::InvalidInput, "Change this month's approved allocation directly; historical review belongs to a later period"
        end
      end

      def protect_historical_replacement!(previous, month, kind)
        if previous && previous.period != month && !previous.balance_delta_minutes.zero?
          raise Workflow::Conflict, "A historical balance decision must retain its original period"
        end
        if previous&.balance_delta_minutes&.positive? && %w[defer correction advance].include?(kind) &&
            entries.where(kind: "accrual", period: previous.period..).where("id > ?", previous.id).exists?
          raise Workflow::Conflict, "Earned accrual followed this treatment; preserve its balance and review a later-period correction"
        end
      end

      def verify_origin_attendance!(origin, kind)
        reference = origin.attendance_reference
        if %w[unpaid advance].include?(kind) && reference &&
            reference["digest"] != PtoFacts.new(@employment, month: Date.iso8601(reference.fetch("period"))).attendance_digest
          raise Workflow::Conflict, "Original attendance changed; reconcile its case before recovering money"
        end
      end

      def historical_values(facts, context, month, kind, options, command_digest)
        origin, previous, obligation, component = context.values_at(:origin, :previous, :obligation, :component)
        quantity = obligation.fetch(:remaining_minutes)
        if kind == "advance" && obligation[:debt]
          raise ConsultantReview::InvalidInput, "This case is already an advance; defer review rather than borrowing twice"
        end
        policy = policies.find(facts.fetch("policy_id"))
        available = facts.fetch("closing_minutes").to_d - (previous&.balance_delta_minutes || 0)
        if kind == "advance" && available - quantity < -policy.advance_limit_minutes
          raise ConsultantReview::InvalidInput, "Advance exceeds the configured limit"
        end
        rate, amount = historical_rate(origin, kind, options, quantity)
        rate["command_digest"] = command_digest
        balance = kind == "advance" ? -quantity : (obligation[:debt] && %w[unpaid waive].include?(kind) ? quantity : 0)
        protect_later_debits!(previous, month, balance)
        { consultant_pto_policy: policy, previous_entry: previous, origin_entry: origin, origin_component: component, period: month,
          case_key: "review:#{origin.id}:#{component}", kind: "review_#{kind}", minutes: quantity,
          debt_minutes: kind == "advance" ? borrowed_minutes(quantity, available) : 0, balance_delta_minutes: balance,
          cash_amount_minor: amount, rate_basis: rate, source_digest: facts.fetch("attendance_digest") }
      end

      def historical_rate(origin, kind, options, quantity)
        rate = kind == "unpaid" ? recovery_rate(*options.values_at(:rate_amount, :rate_hours, :rate_reference)) : {}
        if kind == "unpaid" && origin.rate_basis["origin_amount"] &&
            (rate["amount"].to_d != origin.rate_basis["origin_amount"].to_d || rate["hours"].to_d != origin.rate_basis["origin_hours"].to_d)
          raise ConsultantReview::InvalidInput, "Historical recovery must use the immutable approved origin amount and hours basis"
        end
        amount = kind == "unpaid" ? (rate.fetch("amount").to_d * quantity / (rate.fetch("hours").to_d * 60) * 100).round(0, BigDecimal::ROUND_HALF_UP).to_i : 0
        raise ConsultantReview::InvalidInput, "Historical recovery amount exceeds supported minor units" unless amount.between?(0, 9_000_000_000_000_000)

        rate.merge!(origin.rate_basis.slice("origin_compensation_id", "origin_amount", "origin_hours", "origin_period", "origin_source_digest"))
        [rate, amount]
      end

      def post_accrual!(policy, month, key)
        due = month.change(day: policy.accrual_day)
        obligations = PtoObligations.new(@employment, as_of: month.end_of_month).call.select { |row| row[:accruable] }
        accrual = entries.create!(company: @company, employment: @employment, consultant_pto_policy: policy, actor: @actor,
          period: month, case_key: key, kind: "accrual", minutes: policy.monthly_accrual_minutes,
          balance_delta_minutes: policy.monthly_accrual_minutes, source_digest: Digest::SHA256.hexdigest("#{policy.id}:#{due}"),
          reason: "Configured accrual", idempotency_key: key)
        allocate_accrual!(accrual, obligations)
      end

      def allocate_accrual!(accrual, obligations)
        remaining = accrual.minutes
        obligations.sort_by { |row| [row[:origin].period, row[:origin].id] }.each do |row|
          applied = [remaining, row[:remaining_minutes]].min
          break unless applied.positive?

          PayrollPtoAllocation.create!(company: @company, employment: @employment, accrual_entry: accrual,
            origin_entry: row[:origin], minutes: applied)
          remaining -= applied
        end
      end

      def protect_later_debits!(previous, month, balance)
        return unless balance < (previous&.balance_delta_minutes || 0)
        return unless entries.heads.where("period > ? AND balance_delta_minutes < 0", month).exists?

        raise Workflow::Conflict, "A later approved leave decision consumes this balance; reconcile it before backdating a debit"
      end

      def synchronize(from, require_current_workspace: true, protect_bank_activity: true)
        Entitlement.require!(@company.id)
        ApplicationRecord.transaction do
          runs = PayrollRun.where(company: @company).where("period >= ?", from).order(:id).lock.to_a
          @employment.with_lock do
            authorize!(require_current_workspace:)
            if protect_bank_activity && runs.any? { |run| protected_activity?(run) }
              raise Workflow::Conflict, "Bank activity exists; keep its approved PTO source unchanged and review a later-period correction"
            end
            yield
          end
        end
      end

      def protected_activity?(run)
        PayrollIndiaHandoff.active.exists?(payroll_run: run, employment: @employment) ||
          PayrollPaymentGroup.where(payroll_run: run, employment: @employment).any? { |group| group.in_flight_legs.exists? }
      end

      def authorize!(require_current_workspace: true)
        today = @company.resolved_time_zone.today
        actors = User.kept.where(id: @actor&.id)
        actors = actors.where(current_workspace_id: @company.id) if require_current_workspace
        active = @actor && actors.exists? &&
          @actor.employments.kept.where(company: @company, joined_at: ..today).where("resigned_at IS NULL OR resigned_at >= ?", today).exists? &&
          @actor.roles.where(resource: @company, name: %w[owner admin]).exists?
        raise Workflow::NotAuthorized, "An active owner or admin in this workspace must approve PTO decisions" unless active
      end

      def protect_recovery!(entry)
        return unless entry

        recovery = PayrollPtoRecovery.heads.find_by(payroll_pto_entry: entry)
        if recovery && recovery.kind != "released"
          raise Workflow::Conflict, "This case is reserved or recovered; reconcile it before changing its treatment"
        end
        if PayrollPtoAllocation.exists?(origin_entry: entry) ||
            entries.heads.exists?(origin_entry: entry, kind: %w[review_unpaid review_waive review_advance])
          raise Workflow::Conflict, "Recovery already uses this decision; review the remaining obligation or cancel its unsubmitted treatment before correcting the source"
        end
      end

      def policies
        ConsultantPtoPolicy.where(company: @company, employment: @employment)
      end

      def recovery_rate(amount, hours, reference)
        unless amount.is_a?(String) && amount.match?(ConsultantRevision::AMOUNT_FORMAT)
          raise ConsultantReview::InvalidInput, "Provide the approved historical amount as an exact decimal"
        end
        amount_minutes = amount.to_d * 60
        basis_minutes = minutes(hours)
        unless amount_minutes.positive? && basis_minutes.positive? && reference.is_a?(String) && reference.strip.length.between?(1, 200)
          raise ConsultantReview::InvalidInput, "Provide the approved historical amount, hours basis and evidence reference"
        end
        { "amount" => (amount_minutes / 60).to_s("F"), "hours" => (basis_minutes / 60).to_s("F"), "reference" => reference }
      end

      def canonical_allocations(values)
        unless values.is_a?(Array) && values.size.between?(1, DECISIONS.size)
          raise ConsultantReview::InvalidInput, "Provide the explicit leave breakdown"
        end
        parts = values.map { |value| allocation_part(value) }
        if parts.count { |part| part.fetch("minutes") == "remaining" } > 1
          raise ConsultantReview::InvalidInput, "Choose only one treatment for the remaining source gap"
        end
        unless parts.pluck("kind").uniq.size == parts.size
          raise ConsultantReview::InvalidInput, "Use each leave treatment only once in the breakdown"
        end
        parts.sort_by { |part| DECISIONS.index(part.fetch("kind")) }
      end

      def allocation_part(value)
        value = value.stringify_keys if value.is_a?(Hash)
        unless value.is_a?(Hash) && value.keys.sort == %w[hours kind] && DECISIONS.include?(value["kind"])
          raise ConsultantReview::InvalidInput, "Use only a named leave treatment and decimal hours"
        end
        return { "kind" => value.fetch("kind"), "minutes" => "remaining" } if value["hours"] == "remaining"

        quantity = minutes(value.fetch("hours"))
        raise ConsultantReview::InvalidInput, "Every leave allocation must be positive" unless quantity.positive?

        { "kind" => value.fetch("kind"), "minutes" => quantity.to_s("F") }
      end

      def resolve_allocations(parts, total)
        fixed = parts.reject { |part| part.fetch("minutes") == "remaining" }
        remainder = total - fixed.sum(0.to_d) { |part| part.fetch("minutes").to_d }
        if fixed.size < parts.size
          raise ConsultantReview::InvalidInput, "The remaining source gap must be positive" unless remainder.positive?

          parts = parts.map { |part| part.fetch("minutes") == "remaining" ? part.merge("minutes" => remainder.to_s("F")) : part }
        end
        unless parts.sum(0.to_d) { |part| part.fetch("minutes").to_d } == total
          raise ConsultantReview::InvalidInput, "Distinct approved leave allocations must total exactly the source gap"
        end
        parts
      end

      def entries
        PayrollPtoEntry.where(company: @company, employment: @employment)
      end

      def iso_date(value)
        raise Date::Error unless value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}\z/)

        date = Date.iso8601(value)
        raise Date::Error unless (1900..2099).cover?(date.year)

        date
      end

      def minutes(value, signed: false)
        pattern = signed ? /\A-?\d{1,7}(\.\d{1,2})?\z/ : /\A\d{1,7}(\.\d{1,2})?\z/
        raise ConsultantReview::InvalidInput, "Enter configured hours as decimal strings with at most two places" unless value.is_a?(String) && value.match?(pattern)

        value.to_d * 60
      end
  end
end
