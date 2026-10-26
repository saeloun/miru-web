# frozen_string_literal: true

module Reports
  class ProfitabilityProjection
    class InvalidAssumptions < StandardError; end

    def initialize(assumptions)
      raise InvalidAssumptions, "Supply a planning worksheet" unless assumptions.is_a?(Hash)

      @input = assumptions.deep_stringify_keys
    end

    def process
      currency = @input["currency"]
      raise InvalidAssumptions, "Choose INR or USD" unless %w[INR USD].include?(currency)

      start = start_month
      horizon = integer("months", 1..24)
      reserve_months = integer("reserve_months", 1..12)
      people = lines("people", 200).map { |line| person(line) }
      overheads = overhead_rows
      summary = summarize(people, overheads, reserve_months)
      months = monthly_projection(summary, start, horizon)
      { currency:, people:, overheads:, summary:, months:,
        totals: summary.slice(:revenue, :cost, :margin).transform_values { |value| value && value * horizon },
        incomplete: people.any? { |row| row[:flags].any? } || overheads.any? { |row| row[:flags].any? } }
    end

    private

      def overhead_rows
        lines("overheads", 50).map do |line|
          { name: label(line, "name"), amount: number(line, "monthly_amount"), flags: [] }.tap do |row|
            row[:flags] << "Missing monthly overhead amount" if row[:amount].nil?
          end
        end
      end

      def monthly_projection(summary, start, horizon)
        horizon.times.map do |index|
          summary.slice(:revenue, :cost, :margin).merge(month: (start >> index).iso8601,
            closing_cash: summary[:opening_cash] && summary[:net_cash_burn] && summary[:opening_cash] - summary[:net_cash_burn] * (index + 1))
        end
      end

      def start_month
        value = @input["start_month"].to_s
        raise InvalidAssumptions, "Use a month start in YYYY-MM-01 format" unless value.match?(/\A20\d{2}-\d{2}-01\z/)

        Date.iso8601(value)
      rescue Date::Error
        raise InvalidAssumptions, "Choose a valid forecast start month"
      end

      def integer(key, range)
        value = @input[key].to_s
        raise InvalidAssumptions, "Invalid #{key.humanize.downcase}" unless value.match?(/\A\d{1,2}\z/) && range.cover?(value.to_i)

        value.to_i
      end

      def lines(key, limit)
        value = @input[key]
        unless value.is_a?(Array) && value.size <= limit && value.all? { |line| line.is_a?(Hash) }
          raise InvalidAssumptions, "Supply at most #{limit} #{key} rows"
        end
        value
      end

      def label(line, key)
        value = line[key]
        unless value.is_a?(String) && value.strip.present? && value.length <= 100
          raise InvalidAssumptions, "Every row needs a name of at most 100 characters"
        end
        value.strip
      end

      def number(line, key, maximum = 1_000_000_000_000)
        value = line[key]
        return if value.nil? || value == ""

        value = value.to_s
        unless value.match?(/\A\d{1,13}(?:\.\d{1,4})?\z/) && value.to_d <= maximum
          raise InvalidAssumptions, "#{key.humanize} must be a number between 0 and #{maximum} (up to 4 decimal places)"
        end
        value.to_d
      end

      def person(line)
        capacity = number(line, "capacity_hours", 744)
        utilization = number(line, "utilization", 100)
        rate = number(line, "billing_rate")
        compensation = number(line, "monthly_compensation")
        flags = []
        flags << "Missing monthly capacity" unless capacity
        flags << "Missing target utilization" unless utilization
        flags << "Missing monthly compensation" unless compensation
        billable = capacity && utilization && capacity * utilization / 100
        flags << "Missing billing rate" if rate.nil? && billable != 0
        revenue = billable == 0 ? 0.to_d : billable && rate && billable * rate
        { name: label(line, "name"), capacity_hours: capacity, billable_hours: billable,
          revenue:, compensation:, margin: revenue && compensation && revenue - compensation, flags: }
      end

      def sum(rows, key)
        rows.sum(0.to_d) { |row| row[key] } unless rows.any? { |row| row[key].nil? }
      end

      def ratio(numerator, denominator)
        numerator / denominator if numerator && denominator && denominator.positive?
      end

      def summarize(people, overheads, reserve_months)
        revenue = sum(people, :revenue)
        compensation = sum(people, :compensation)
        overhead = sum(overheads, :amount)
        cost = compensation && overhead && compensation + overhead
        margin = revenue && cost && revenue - cost
        opening_cash = number(@input, "opening_cash")
        collections = number(@input, "monthly_collections")
        burn = cost && collections && cost - collections
        reserve = cost && cost * reserve_months
        gap = reserve && opening_cash && [reserve - opening_cash, 0.to_d].max
        {
          revenue:, compensation:, overhead:, cost:, margin:,
          margin_percentage: ratio(margin, revenue)&.*(100),
          utilization: ratio(sum(people, :billable_hours), sum(people, :capacity_hours))&.*(100),
          opening_cash:, monthly_collections: collections, net_cash_burn: burn,
          runway_months: ratio(opening_cash, burn), reserve_target: reserve,
          months_to_reserve: gap == 0 ? 0.to_d : ratio(gap, burn && -burn)
        }
      end
  end
end
