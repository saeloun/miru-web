# frozen_string_literal: true

module Payroll
  class PtoFacts
    VERSION = "miru-pto-facts-v1"

    def initialize(employment, month:, sources: nil)
      @employment, @month = employment, month.beginning_of_month
      @company = sources ? sources.company : employment.company
      @sources = sources || ConsultantSources.new(company: @company, employments: [employment], month: @month)
    end

    def call
      Entitlement.require!(@company.id)
      policy = policy_at(@month)
      return unavailable unless policy

      data = period_facts(policy)
      data["digest"] = digest([data, policy.attributes.except("created_at", "updated_at")])
      data
    end

    def attendance_digest
      @attendance_digest ||= begin
        work = @sources.work_fingerprint(@employment.user_id)
        leave = @sources.leave_fingerprint(@employment.user_id)
        terms = @sources.terms(@employment.id)
        digest([work, leave, @employment.attributes.slice("joined_at", "resigned_at"), terms&.id,
          attendance.slice(:expected_hours, :recorded_hours, :approved_work_hours, :not_required_work_hours, :warnings)])
      end
    end

    private

      def period_facts(policy)
        review = attendance
        heads = entry_heads(as_of: @month.end_of_month)
        current = heads.find { |entry| entry.case_key == "month:#{@month.iso8601}" }
        gap = attendance_review.uncovered_work_minutes
        fresh = current && current.source_digest == attendance_digest && current.minutes == gap && current.consultant_pto_policy_id == policy.id
        totals = allocation_totals(current, fresh)
        unresolved = fresh ? totals.fetch("correction", 0.to_d) : gap
        blockers = decision_blockers(current, fresh, unresolved)
        historical = historical_sources(heads, blockers)
        blockers << "pto_accrual_pending" if pending_accrual?(heads)
        blockers.uniq!
        {
          "version" => VERSION, "policy_id" => policy.id, "month" => @month.strftime("%Y-%m"),
          "attendance_digest" => attendance_digest, "decision_id" => current&.id,
          "decision" => fresh ? current.kind : nil, "expected_hours" => review[:expected_hours],
          "monthly_fee" => review[:monthly_fee], "compensation_id" => review[:compensation_id]
        }.merge(balance_facts(policy, heads), treatment_facts(current, fresh, totals, unresolved, gap), history_facts(heads, historical, blockers))
      end

      def allocation_totals(current, fresh)
        return {} unless fresh

        current.approved_allocations.to_h { |part| [part.fetch("kind"), part.fetch("minutes").to_d] }
      end

      def decision_blockers(current, fresh, unresolved)
        blockers = []
        blockers << "pto_decision_required" if unresolved.positive?
        blockers << "pto_decision_source_changed" if current && !fresh
        blockers
      end

      def balance_facts(policy, heads)
        monthly = heads.select { |entry| entry.period == @month }
        opening = policy.opening_minutes + heads.select { |entry| entry.period < @month }.sum(0.to_d, &:balance_delta_minutes)
        accrued = monthly.select { |entry| entry.kind == "accrual" }.sum(0.to_d, &:minutes)
        closing = opening + monthly.sum(0.to_d, &:balance_delta_minutes)
        { "opening_hours" => hours(opening), "accrued_hours" => hours(accrued), "closing_hours" => hours(closing),
          "closing_minutes" => closing.to_s("F") }
      end

      def treatment_facts(current, fresh, totals, unresolved, gap)
        zero = 0.to_d
        {
          "paid_hours" => hours(totals.fetch("paid", zero) + totals.fetch("advance", zero)),
          "advance_hours" => hours(fresh ? current.debt_minutes : 0), "unpaid_hours" => hours(totals.fetch("unpaid", zero)),
          "deferred_hours" => hours(totals.fetch("defer", zero)), "waived_hours" => hours(totals.fetch("waive", zero)),
          "unresolved_hours" => hours(unresolved), "gap_hours" => hours(gap), "allocations" => fresh ? current.approved_allocations : [],
          "gap_minutes" => gap.to_s("F"), "unresolved_minutes" => unresolved.to_s("F"),
          "unpaid_minutes" => totals.fetch("unpaid", zero).to_s("F")
        }
      end

      def history_facts(heads, historical, blockers)
        unpaid = heads.select { |entry| entry.period == @month && entry.kind == "review_unpaid" }
        { "historical_deduction_minor" => unpaid.sum(&:cash_amount_minor), "historical_decision_ids" => unpaid.map(&:id),
          "historical_sources" => historical, "blockers" => blockers, "entry_ids" => heads.map(&:id) }
      end

      def historical_sources(heads, blockers)
        heads.filter_map { |entry| entries.find { |origin| origin.id == entry.origin_entry_id } if entry.period == @month && entry.kind == "review_unpaid" }.uniq(&:id).map do |origin|
          reference = origin.attendance_reference
          origin_month = reference && Date.iso8601(reference.fetch("period"))
          current_digest = reference && self.class.new(@employment, month: origin_month, sources: @sources.for_month(origin_month)).attendance_digest
          current_head = entry_heads.find { |entry| entry.case_key == origin.case_key }&.id
          if current_head != origin.id || reference && reference["digest"] != current_digest
            blockers << "pto_historical_source_changed"
          end
          { "entry_id" => origin.id, "current_head_id" => current_head, "approved_source" => reference, "current_digest" => current_digest }
        end
      end

      def pending_accrual?(heads)
        due_month = policies.first.opening_on.beginning_of_month
        while due_month <= @month
          applicable = policy_at(due_month)
          if applicable.monthly_accrual_minutes.positive? && applicable.accrual_eligible?(due_month, through: [@month.end_of_month, @company.resolved_time_zone.today].min) &&
              !heads.any? { |entry| entry.case_key == "accrual:#{due_month.iso8601}" }
            return true
          end
          due_month = due_month.next_month
        end
        false
      end

      def attendance
        @attendance ||= attendance_review.process(include_expenses: false, include_pto: false)
      end

      def attendance_review
        @attendance_review ||= ConsultantReview.new(employment: @employment, month: @month, cutoff: @month.end_of_month, sources: @sources)
      end

      def policies
        @sources.pto_policies(@employment.id)
      end

      def policy_at(month)
        policies.reverse.find { |policy| policy.effective_on <= month }
      end

      def entries
        @sources.pto_entries(@employment.id)
      end

      def entry_heads(as_of: nil)
        eligible = as_of ? entries.select { |entry| entry.period <= as_of } : entries
        replaced = eligible.filter_map(&:previous_entry_id)
        eligible.reject { |entry| replaced.include?(entry.id) }
      end

      def unavailable
        data = { "version" => VERSION, "policy_id" => nil, "month" => @month.strftime("%Y-%m"),
                 "blockers" => ["pto_policy_required"], "attendance_digest" => attendance_digest }
        data.merge("digest" => digest(data))
      end

      def hours(minutes)
        (minutes.to_d / 60).to_s("F")
      end

      def digest(value)
        Digest::SHA256.hexdigest(JSON.generate(json_value(value)))
      end

      def json_value(value)
        case value
        when Hash then value.transform_values { |item| json_value(item) }
        when Array then value.map { |item| json_value(item) }
        when String, Integer, NilClass, TrueClass, FalseClass then value
        else value.to_s
        end
      end
  end
end
