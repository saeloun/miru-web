# frozen_string_literal: true

module Payroll
  class PtoReport
    def initialize(company, as_of:)
      @company, @as_of = company, as_of
    end

    def call
      Entitlement.require!(@company.id)
      ids = ConsultantPtoPolicy.where(company: @company, effective_on: ..@as_of).distinct.pluck(:employment_id)
      cases = @company.employments.where(id: ids).includes(:user).order(:id).map { |employment| employment_case(employment) }
      { as_of: @as_of.iso8601, cases: }
    end

    def cash_cases(employment)
      Entitlement.require!(@company.id)
      raise ActiveRecord::RecordNotFound unless employment.company_id == @company.id

      PayrollPtoEntry.effective_heads(@as_of).where(employment:, kind: %w[unpaid allocation review_unpaid]).order(:period, :id)
        .filter_map { |entry| cash_case(entry, employment) }
    end

    private

      def employment_case(employment)
        facts = PtoFacts.new(employment, month: @as_of.beginning_of_month).call
        policy = ConsultantPtoPolicy.find(facts.fetch("policy_id"))
        year_start = leave_year_start(policy)
        deferred = deferred_cases(employment)
        negative_minutes = [-facts.fetch("closing_minutes").to_d, 0.to_d].max
        unresolved_minutes = facts.fetch("unresolved_minutes").to_d
        cash = cash_cases(employment)
        overdue = deferred.any? { |entry| Date.iso8601(entry.fetch(:period)) < year_start } ||
          cash.any? { |entry| Date.iso8601(entry.fetch(:period)) < year_start }
        { employment_id: employment.id, consultant_name: employment.user.full_name, as_of: @as_of.iso8601,
          historical_negative_hours: (negative_minutes / 60).to_s("F"), deferred_cases: deferred, cash_cases: cash, facts:,
          threshold_review: negative_minutes >= policy.negative_threshold_minutes && negative_minutes.positive? ||
            unresolved_minutes >= policy.exception_threshold_minutes && unresolved_minutes.positive?,
          year_end_review: @as_of >= year_start.next_year - 1 || overdue,
          year_end_review_on: (@as_of >= year_start.next_year - 1 ? year_start.next_year - 1 : year_start - 1).iso8601,
          exit_review: employment.resigned_at.present? && employment.resigned_at <= @as_of,
          leave_year_start: year_start.iso8601, carry_rule: policy.carry_rule }
      end

      def leave_year_start(policy)
        start = Date.new(@as_of.year, policy.leave_year_month, policy.leave_year_day)
        start > @as_of ? start.prev_year : start
      end

      def deferred_cases(employment)
        PtoObligations.new(employment, as_of: @as_of).call.map do |row|
          entry = row.fetch(:origin)
          { id: entry.id, period: entry.period.iso8601, kind: row[:review]&.kind || row[:component],
            hours: (row.fetch(:remaining_minutes) / 60).to_s("F"), accrued_recovery_hours: (row.fetch(:accrued_recovery_minutes) / 60).to_s("F") }
        end
      end

      def cash_case(entry, employment)
        return if entry.kind == "allocation" && entry.approved_allocations.none? { |part| part["kind"] == "unpaid" }
        recovery = PayrollPtoRecovery.heads.find_by(payroll_pto_entry: entry)
        return if recovery&.kind == "settled"

        amount = cash_amount(entry, employment)
        quantity = entry.kind == "allocation" ? entry.approved_allocations.find { |part| part["kind"] == "unpaid" }.fetch("minutes").to_d : entry.minutes
        accrued = entry.origin_entry_id ? PayrollPtoAllocation.where(origin_entry_id: entry.origin_entry_id).sum(:minutes) : 0.to_d
        { entry_id: entry.id, origin_entry_id: entry.origin_entry_id, origin_component: entry.origin_component,
          original_period: entry.origin_entry&.period&.iso8601, accrued_recovery_hours: (accrued / 60).to_s("F"),
          period: entry.period.iso8601, hours: (quantity / 60).to_s("F"), amount_minor: amount&.to_s, recovery_id: recovery&.id,
          state: recovery&.kind || "unreserved", payroll_run_id: recovery&.payroll_run_id,
          payroll_revision_id: recovery&.payroll_revision_id }
      end

      def cash_amount(entry, employment)
        return entry.cash_amount_minor if entry.kind == "review_unpaid"

        review = ConsultantReview.new(employment:, month: entry.period, cutoff: @as_of).process(include_expenses: false)
        review[:monthly_fee] && review[:fee_estimate] ? ((review[:monthly_fee].to_d - review[:fee_estimate].to_d) * 100).to_i : nil
      end
  end
end
