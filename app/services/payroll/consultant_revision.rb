# frozen_string_literal: true

module Payroll
  class ConsultantRevision
    DECISIONS = {
      "no_timeoff_entries" => "verified_zero_pto",
      "timeoff_pay_classification_required" => "reviewed_day_mapping",
      "work_review_required" => "reviewed_override"
    }.freeze
    ACKNOWLEDGED_WARNINGS = %w[work_requires_review timeoff_requires_review unexplained_hours].freeze
    ADJUSTMENT_KINDS = { "other_earning" => "extras", "other_deduction" => "deductions", "withholding" => "deductions" }.freeze
    AMOUNT_FORMAT = /\A\d{1,12}(\.\d{1,2})?\z/
    MAX_CONSULTANTS = 100

    def initialize(run, actor:)
      @run = run
      @actor = actor
      @company = run.company
      @first = run.period
      @last = run.period.end_of_month
    end

    def preparation(cutoff:)
      Entitlement.require!(@company.id)
      cutoff_date = cutoff_date(cutoff)
      retained_ids = MercuryRevisionGuard.new(@run).retained_lines.pluck("employment_id")
      employments.map { |employment| consultant_summary(employment, cutoff_date, retained: retained_ids.include?(employment.id)) }
    end

    def create!(consultants:, cutoff:, expected_digest:, idempotency_key:)
      Entitlement.require!(@company.id)
      cutoff_date = cutoff_date(cutoff)
      retained = MercuryRevisionGuard.new(@run).retained_lines
      lines = Array(consultants).map do |input|
        previous = retained.find { |line| line["employment_id"].to_s == input[:employment_id].to_s }
        previous ? carry_line(previous, input) : build_line(input, cutoff_date)
      end
      raise MercuryPayment::Blocked.new("no_consultants_selected") if lines.empty?
      retained.each do |line|
        lines << carry_line(line, {}) unless lines.any? { |entry| entry["employment_id"] == line["employment_id"] }
      end

      Workflow.new(@run).revise!(actor: @actor, payload: payload(lines), idempotency_key:, expected_digest:)
    end

    private

      def cutoff_date(value)
        ConsultantReview.period(@first.strftime("%Y-%m"), value, today: @company.resolved_time_zone.today).last
      end

      def employments
        @company.employments.kept.joins(:consultant_compensations).distinct.includes(:user, :employee_record)
          .where("employments.joined_at IS NULL OR employments.joined_at <= ?", @last)
          .where("employments.resigned_at IS NULL OR employments.resigned_at >= ?", @first)
          .order(:id).limit(MAX_CONSULTANTS)
      end

      def consultant_summary(employment, cutoff, retained:)
        review = review_for(employment, cutoff, {})
        source = capture(employment)
        unresolvable = unresolvable_codes(source, review)
        billing = BillingIdentity.new(employment).binding
        not_ready = unresolvable + (review[:fee_estimate] ? [] : ["fee_unavailable"]) + Array(review.dig(:pto, "blockers"))
        not_ready << "billing_identity_review_required" unless billing
        review.merge(user_id: employment.user_id, source_exceptions: source.fetch("review_exceptions").pluck("code").uniq,
          required_acknowledgements: acknowledgement_codes(source, review), not_ready_reasons: not_ready, ready: not_ready.empty?,
          billing_identity: billing, current: current_selection(employment), locked: bank_activity?(employment),
          retained:, profile_completion: ProfileCompletion.new(@run, actor: @actor).summary(employment))
      end

      def current_selection(employment)
        line = @run.current_revision&.payroll_payload&.fetch("lines", [])&.find { |entry| entry["employment_id"] == employment.id }
        return { included: false } unless line

        selection_for(line)
      end

      def selection_for(line)
        preparation = line["preparation"] || {}
        adjustments = (line["extras"] + line["deductions"]).to_h { |entry| [entry["code"], (BigDecimal(entry["amount_minor"]) / 100).to_s("F")] }
        { included: true, confirmed_unpaid_hours: preparation["confirmed_unpaid_hours"], unpaid_reason: preparation["unpaid_reason"],
          expense_ids: line["reimbursements"].filter_map { |entry| ClaimReference.expense_id(entry["source_reference"]) },
          other_earning: adjustments["other_earning"], other_deduction: adjustments["other_deduction"], withholding: adjustments["withholding"] }.tap do |selection|
          selection[:service_fee_review] = preparation["service_fee_review"] if preparation["service_fee_review"]
        end
      end

      def carry_line(line, input)
        unless retained_selection?(input, selection_for(line))
          raise Workflow::Conflict, "A bank transfer exists, so its amounts and claims must stay unchanged in this revision"
        end

        retained = line.deep_dup
        employment = @company.employments.find(line["employment_id"])
        if (billing = BillingIdentity.new(employment).binding)
          retained["preparation"] ||= {}
          retained["preparation"]["billing_identity"] = billing
        end
        retained
      end

      def retained_selection?(input, selection)
        input.except(:employment_id, :acknowledged).all? do |key, value|
          previous = selection[key]
          case key
          when :expense_ids
            value.is_a?(Array) && value.all? { |id| id.is_a?(Integer) || id.is_a?(String) && id.match?(/\A[1-9]\d*\z/) } &&
              value.map(&:to_s).sort == selection.fetch(:expense_ids).map(&:to_s).sort
          when :confirmed_unpaid_hours
            (value.nil? || value.is_a?(String) && (value.empty? || value.match?(AMOUNT_FORMAT))) && value.to_s.to_d == previous.to_s.to_d
          when :other_earning, :other_deduction, :withholding
            if value.nil? || value == ""
              previous.blank?
            else
              value.is_a?(String) && value.match?(AMOUNT_FORMAT) && value.to_d.positive? && value.to_d == previous.to_s.to_d
            end
          when :unpaid_reason
            (value.nil? || value.is_a?(String)) && value.to_s == previous.to_s
          when :service_fee_review
            value == previous
          else
            false
          end
        end
      end

      def bank_activity?(employment)
        PayrollIndiaHandoff.active.exists?(payroll_run_id: @run.id, employment_id: employment.id) ||
          PayrollPaymentGroup.where(payroll_run_id: @run.id, employment_id: employment.id).any? { |group| group.in_flight_legs.exists? }
      end

      def review_for(employment, cutoff, inputs)
        ConsultantReview.new(employment:, month: @first, cutoff:, inputs: inputs.merge(own_run_id: @run.id)).process
      end

      def capture(employment)
        PayrollSources::MonthlyFacts.new(company: @company, employment:, actor: @actor, month: @first.strftime("%Y-%m"),
          policy_versions: { pay: policy_version("pay"), attendance: policy_version("proration") }).call
      end

      def unresolvable_codes(source, review = nil)
        resolved = DECISIONS.keys
        resolved += ["partial_employment_month"] if review&.fetch(:service_fee_review, nil)
        source.fetch("review_exceptions").pluck("code").uniq - resolved
      end

      def acknowledgement_codes(source, review)
        (source.fetch("review_exceptions").pluck("code") & DECISIONS.keys).uniq + (review[:warnings] & ACKNOWLEDGED_WARNINGS)
      end

      # Capture pay only from reviewed facts before reserving claims for approval.
      def build_line(input, cutoff)
        employment = @company.employments.kept.find(input[:employment_id])
        review = review_for(employment, cutoff, input.slice(:confirmed_unpaid_hours, :unpaid_reason, :expense_ids))
        source = capture(employment)
        codes = line_blockers(employment, review, source, input)
        raise MercuryPayment::Blocked.new(codes) if codes.any?

        expenses = @company.expenses.where(id: review[:selected_expense_ids]).order(:id).to_a
        adjustments = reimbursement_adjustments(expenses, review) + reviewed_adjustments(input) + pto_adjustments(review)
        calculation = calculate(employment, review, source, adjustments)
        raise MercuryPayment::Blocked.new("calculation_requires_review") unless calculation["review_ready"] && calculation_base(calculation) == review[:fee_estimate].to_d

        line_for(employment, source, calculation, review, cutoff)
      end

      def line_blockers(employment, review, source, input)
        codes = unresolvable_codes(source, review) + Array(review.dig(:pto, "blockers"))
        codes << "fee_unavailable" unless review[:fee_estimate]
        codes << "acknowledgement_required" if acknowledgement_codes(source, review).any? && input[:acknowledged] != true
        codes << "consultant_inactive" if employment.user.discarded?
        codes << "billing_identity_review_required" unless BillingIdentity.new(employment).binding
        codes
      end

      # Reapproval can move a claim past cutoff without changing its selected ID.
      def reimbursement_adjustments(expenses, review)
        selected = review.fetch(:eligible_expenses).select { |expense| review[:selected_expense_ids].include?(expense[:id]) }
          .sort_by { |expense| expense[:id] }
        unless expenses.map { |expense| ClaimReference.for(expense) } == selected.pluck(:source_reference)
          raise ConsultantReview::InvalidInput, "Selected claims changed after eligibility review; refresh the preview"
        end

        expenses.map do |expense|
          adjustment("expense_#{expense.id}", "reimbursement", expense.amount.to_s("F"), ClaimReference.for(expense), "approved_claim")
        end
      end

      def reviewed_adjustments(input)
        ADJUSTMENT_KINDS.keys.filter_map do |kind|
          amount = input[kind.to_sym].presence
          next unless amount
          raise MercuryPayment::Blocked.new("adjustment_invalid") unless amount.is_a?(String) && amount.match?(AMOUNT_FORMAT) && amount.to_d.positive?

          adjustment(kind, kind, amount, "accounts.adjustment", "accounts_reviewed")
        end
      end

      def pto_adjustments(review)
        Array(review.dig(:pto, "historical_decision_ids")).map do |id|
          entry = PayrollPtoEntry.find(id)
          adjustment("pto_recovery_#{entry.id}", "other_deduction", (entry.cash_amount_minor.to_d / 100).to_s("F"),
            "pto:#{entry.id}", "approved_pto_recovery")
        end
      end

      def adjustment(code, kind, amount, source, reason)
        { "code" => code, "kind" => kind, "amount" => amount, "currency" => "INR", "origin_period" => @first.strftime("%Y-%m"),
          "source" => source, "reason" => reason, "reviewed" => true }
      end

      def calculate(employment, review, source, adjustments)
        expected, unpaid = calculation_quantities(review)
        input = {
          "company_id" => @company.id.to_s, "person_id" => employment.user_id.to_s, "period" => @first.strftime("%Y-%m"),
          "engagement_type" => "consultant", "source_currency" => "INR", "settlement_currency" => "INR",
          "compensation" => { "basis" => "monthly", "amount" => review[:period_base_fee], "effective_from" => @first.iso8601, "effective_to" => @last.iso8601 },
          "paid_quantity" => (expected - unpaid).to_s("F"), "basis_quantity" => expected.to_s("F"), "quantity_source" => source["digest"],
          "adjustments" => adjustments
        }
        PayrollCalculation::Calculator.new(policy: calculation_policy(minutes: review.dig(:pto, "policy_id").present?), input:).call.deep_dup
      end

      def calculation_quantities(review)
        expected = review[:expected_hours].to_d
        return [expected, review[:confirmed_unpaid_hours].to_d] unless review.dig(:pto, "policy_id")

        [expected * 60, review.fetch(:pto).fetch("unpaid_minutes").to_d]
      end

      def calculation_base(calculation)
        calculation.fetch("lines").find { |line| line["kind"] == "base" }.fetch("amount").to_d
      end

      def calculation_policy(minutes: false)
        profile = { "mode" => "half_away_from_zero", "digits" => 2 }
        { "version" => policy_version("pay"), "effective_from" => @first.iso8601, "effective_to" => @last.iso8601, "reviewed" => true,
          "formula_mapping_confirmed" => true, "attendance_policy_confirmed" => true, "deduction_policy_confirmed" => true,
          "paid_quantity_name" => minutes ? "scheduled minutes less confirmed unpaid minutes" : "expected hours less confirmed unpaid hours",
          "basis_quantity_name" => minutes ? "scheduled minutes" : "expected hours",
          "rounding" => PayrollCalculation::Calculator::ROUNDING_STAGES.index_with { profile } }
      end

      def line_for(employment, source, calculation, review, cutoff)
        components = calculation.fetch("lines").reject { |line| line["kind"] == "base" }.map { |line| component(line) }
        grouped = components.group_by { |_group, _entry| _group }.transform_values { |rows| rows.map(&:last) }
        extras, reimbursements, deductions = %w[extras reimbursements deductions].map { |kind| grouped.fetch(kind, []) }
        {
          "employment_id" => employment.id, "pay_type" => "consultant", "currency" => "INR", "source_snapshot" => source.deep_dup,
          "calculation_snapshot" => calculation, "source_resolutions" => resolutions(source, review),
          "amounts" => { "base_minor" => minor(calculation_base(calculation)), "extras_minor" => extras.sum { |entry| entry["amount_minor"] },
                         "reimbursements_minor" => reimbursements.sum { |entry| entry["amount_minor"] },
                         "deductions_minor" => deductions.sum { |entry| entry["amount_minor"] }, "net_minor" => minor(calculation.fetch("net").to_d) },
          "extras" => extras, "reimbursements" => reimbursements, "deductions" => deductions,
          "preparation" => { "cutoff" => cutoff.iso8601, "confirmed_unpaid_hours" => review[:confirmed_unpaid_hours],
                             "unpaid_reason" => review[:unpaid_reason].presence, "terms_id" => review[:compensation_id].to_s,
                             "billing_identity" => BillingIdentity.new(employment).binding }.tap do |preparation|
            preparation["service_fee_review"] = review[:service_fee_review] if review[:service_fee_review]
          end
        }
      end

      def component(line)
        kind = line.fetch("kind")
        group = kind == "reimbursement" ? "reimbursements" : ADJUSTMENT_KINDS.fetch(kind)
        [group, { "code" => line.fetch("code"), "amount_minor" => minor(line.fetch("amount").to_d), "currency" => "INR",
                  "origin_period" => "#{line.fetch('origin_period')}-01", "source_reference" => line.fetch("source"), "reason_code" => line.fetch("reason") }]
      end

      def resolutions(source, review)
        exceptions = source.fetch("review_exceptions").filter_map do |exception|
          decision = DECISIONS[exception["code"]]
          decision = "reviewed_service_period_fee" if exception["code"] == "partial_employment_month" && review[:service_fee_review]
          decision = "reviewed_pto_ledger" if exception["code"] == "no_timeoff_entries" && source.dig("pto", "paid_hours").to_d.positive?
          decision && resolution(exception["code"], decision, source, exception["source_id"])
        end
        warnings = (review[:warnings] & ACKNOWLEDGED_WARNINGS).map { |code| resolution(code, "accounts_acknowledged", source, nil) }
        exceptions + warnings
      end

      def resolution(code, decision, source, source_id)
        { "code" => code, "decision" => decision, "reason_code" => "accounts_reviewed", "source_digest" => source["digest"],
          "actor_id" => @actor.id, "source_id" => source_id }
      end

      def minor(value)
        (value * 100).to_i
      end

      def payload(lines)
        { "schema_version" => 1, "company_id" => @company.id, "period" => @first.iso8601, "currency" => "INR",
          "policies" => Snapshot::POLICIES.index_with { |kind| { "version" => policy_version(kind), "effective_from" => @first.iso8601, "effective_to" => @last.iso8601 } },
          "exceptions" => [], "lines" => lines }
      end

      def policy_version(kind)
        "miru.consultant.#{kind}.v1"
      end
  end
end
