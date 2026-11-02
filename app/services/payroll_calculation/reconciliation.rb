# frozen_string_literal: true

require_relative "values"

module PayrollCalculation
  class Reconciliation
    include Values

    def call(results:, expected_totals:, recipient_ids:, company_id:, period:)
      rows = immutable(results)
      expected = immutable(expected_totals)
      ids = immutable(recipient_ids)
      issues = []
      validate_population(rows, ids, issues)
      totals = currency_totals(rows, company_id, period, issues)
      compare_totals(totals, expected, issues)
      immutable({ "totals" => totals.transform_values { |amount| formatted(amount) }, "issues" => issues.uniq.sort,
        "reconciled" => issues.empty?, "preview_only" => true })
    rescue KeyError => error
      raise ArgumentError, "missing reconciliation field: #{error.key}"
    end

    private

      def validate_population(rows, ids, issues)
        raise ArgumentError, "recipient IDs must be unique and nonempty" unless ids.is_a?(Array) && ids.any? && ids.uniq == ids

        ids.each { |id| text(id, "recipient ID") }
        issues << "recipient_population_mismatch" unless rows.map { |row| row.fetch("person_id") }.sort == ids.sort
        identities = rows.map { |row| [row.fetch("company_id"), row.fetch("period"), row.fetch("person_id"), row.fetch("currency")] }
        issues << "duplicate_recipient" unless identities.uniq == identities
      end

      def currency_totals(rows, company_id, period, issues)
        rows.each_with_object({}) do |row, totals|
          issues << "company_or_period_mismatch" unless row.fetch("company_id") == company_id && row.fetch("period") == period
          unit = currency(row.fetch("currency"))
          if row["net"].nil?
            issues << "missing_net:#{row.fetch('person_id')}"
            next
          end
          totals[unit] = totals.fetch(unit, BigDecimal("0")) + decimal(row.fetch("net"), "net", negative: true)
          issues << "calculation_requires_review:#{row.fetch('person_id')}" unless row["review_ready"] == true
        end
      end

      def compare_totals(totals, expected, issues)
        issues << "currency_population_mismatch" unless totals.keys.sort == expected.keys.sort
        expected.each do |unit, amount|
          issues << "total_mismatch:#{unit}" unless totals[unit] == decimal(amount, "expected total", negative: true)
        end
      end
  end
end
