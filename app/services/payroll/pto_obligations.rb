# frozen_string_literal: true

module Payroll
  class PtoObligations
    def initialize(employment, as_of:)
      @employment, @as_of = employment, as_of
    end

    def call(excluding_review: nil)
      heads = PayrollPtoEntry.effective_heads(@as_of).where(employment: @employment).where.not(id: excluding_review&.id).to_a
      heads.flat_map do |origin|
        components = origin.approved_allocations.select { |part| %w[defer correction].include?(part.fetch("kind")) }
          .to_h { |part| [part.fetch("kind"), part.fetch("minutes").to_d] }
        components[origin.kind == "opening" ? "opening" : "advance"] = origin.debt_minutes if origin.debt_minutes.positive?
        components.filter_map do |component, original|
          reviews = heads.select { |entry| entry.origin_entry_id == origin.id && entry.origin_component == component }
          debt = %w[opening advance].include?(component)
          allocations = debt ? PayrollPtoAllocation.joins(:accrual_entry).where(origin_entry: origin)
            .where(payroll_pto_entries: { period: ..@as_of }).sum(:minutes) : 0.to_d
          consumed = reviews.select { |entry| %w[review_unpaid review_waive review_advance].include?(entry.kind) }.sum(0.to_d, &:minutes)
          remaining = [original - allocations - consumed, 0.to_d].max
          next unless remaining.positive?

          review = reviews.max_by(&:id)
          { origin:, component:, remaining_minutes: remaining, debt:, accrued_recovery_minutes: allocations,
            accruable: debt && !%w[review_defer review_correction].include?(review&.kind), review: }
        end
      end
    end
  end
end
