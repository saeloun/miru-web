# frozen_string_literal: true

require "digest"
require "json"

module Payroll
  class Snapshot
    POLICIES = %w[pay proration rounding fx mapping].freeze
    AMOUNTS = %w[base_minor extras_minor reimbursements_minor deductions_minor net_minor].freeze
    MAX_LINES = 25
    MAX_PAYLOAD_BYTES = 1_000_000

    def initialize(run, payload, actor_id: nil)
      @run = run
      @payload = payload
      @actor_id = actor_id
    end

    def digest
      json = JSON.generate(canonical(@payload))
      json.bytesize <= MAX_PAYLOAD_BYTES ? Digest::SHA256.hexdigest(json) : nil
    rescue JSON::GeneratorError, TypeError, ArgumentError
      nil
    end

    def inspect
      "#<#{self.class.name} payroll_payload=[FILTERED]>"
    end

    def valid?
      return false unless digest
      return false unless keys?(@payload, %w[schema_version company_id period currency policies exceptions lines])
      return false unless @payload["schema_version"] == 1 && @payload["company_id"] == @run.company_id
      return false unless @payload["period"] == @run.period&.iso8601 && @payload["currency"] == @run.currency
      return false unless @payload["policies"].is_a?(Hash) && (@payload["policies"].keys - POLICIES).empty?
      return false unless @payload["policies"].values.all? { |policy| valid_policy?(policy) }
      return false unless @payload["exceptions"].is_a?(Array) && @payload["exceptions"].all? { |code| code?(code) }

      lines = @payload["lines"]
      return false unless lines.is_a?(Array) && lines.size.between?(1, MAX_LINES)
      return false unless lines.all? { |line| valid_line?(line) }

      ids = lines.pluck("employment_id")
      ids.uniq.size == ids.size && Employment.kept.where(company_id: @run.company_id, id: ids).count == ids.size
    end

    def approval_issues
      return ["invalid_snapshot"] unless valid?

      issues = @payload["exceptions"].dup
      POLICIES.each do |kind|
        policy = @payload["policies"][kind]
        if !policy || Date.iso8601(policy["effective_from"]) > @run.period || Date.iso8601(policy["effective_to"]) < @run.period.end_of_month
          issues << "missing_or_ineffective_#{kind}_policy"
        end
      end
      @payload["lines"].each do |line|
        issues.concat(line_approval_issues(line))
      end
      issues
    end

    private

      def canonical(value, depth = 0)
        raise ArgumentError if depth > 20

        case value
        when Hash
          raise ArgumentError unless value.keys.all? { |key| key.is_a?(String) }

          value.sort.to_h.transform_values { |entry| canonical(entry, depth + 1) }
        when Array
          value.map { |entry| canonical(entry, depth + 1) }
        when String, Integer, NilClass, TrueClass, FalseClass
          value
        else
          raise ArgumentError
        end
      end

      def keys?(value, expected)
        value.is_a?(Hash) && value.keys.all? { |key| key.is_a?(String) } && value.keys.sort == expected.sort
      end

      def code?(value)
        value.is_a?(String) && /\A[a-zA-Z0-9_.:-]{1,100}\z/.match?(value)
      end

      def valid_policy?(policy)
        return false unless keys?(policy, %w[version effective_from effective_to]) && code?(policy["version"])

        first = Date.iso8601(policy["effective_from"])
        last = Date.iso8601(policy["effective_to"])
        first <= last
      rescue Date::Error, TypeError
        false
      end

      def valid_line?(line)
        return false unless valid_line_metadata?(line)
        return false unless keys?(line["amounts"], AMOUNTS) && line["amounts"].values.all? { |amount| minor?(amount) }

        amounts = line["amounts"]
        return false unless %w[extras reimbursements deductions].all? do |kind|
          entries = line[kind]
          entries.is_a?(Array) && entries.all? { |entry| valid_component?(entry) } &&
            entries.sum { |entry| entry["amount_minor"] } == amounts["#{kind}_minor"]
        end

        amounts["net_minor"] == amounts["base_minor"] + amounts["extras_minor"] +
          amounts["reimbursements_minor"] - amounts["deductions_minor"]
      end

      def valid_line_metadata?(line)
        return false unless keys?(line, %w[employment_id pay_type currency source_snapshot source_resolutions calculation_snapshot amounts extras reimbursements deductions])
        return false unless line["employment_id"].is_a?(Integer) && %w[employee consultant].include?(line["pay_type"])
        return false unless line["currency"] == @run.currency
        return false unless valid_source_snapshot?(line)
        return false unless line["calculation_snapshot"].nil? || PayrollCalculation::Calculator.verify_snapshot?(line["calculation_snapshot"])
        line["source_resolutions"].is_a?(Array) && line["source_resolutions"].all? { |resolution| valid_resolution?(resolution) }
      end

      def valid_source_snapshot?(line)
        source = line["source_snapshot"]
        return true if source.nil?

        employment = Employment.find_by(id: line["employment_id"], company_id: @run.company_id)
        source.is_a?(Hash) && employment && PayrollSources::MonthlyFacts.current_snapshot?(source, company: @run.company, employment:)
      end

      def valid_resolution?(resolution)
        keys?(resolution, %w[code reason_code decision source_digest actor_id source_id]) &&
          %w[code reason_code decision].all? { |key| code?(resolution[key]) } &&
          resolution["source_digest"].is_a?(String) && /\A[0-9a-f]{64}\z/.match?(resolution["source_digest"]) &&
          resolution["actor_id"].is_a?(Integer) && (resolution["source_id"].nil? || resolution["source_id"].is_a?(Integer))
      end

      def line_approval_issues(line)
        employment = Employment.find_by(id: line["employment_id"], company_id: @run.company_id)
        source = line["source_snapshot"]
        return ["source_missing_or_changed"] unless source && employment &&
          source["month"] == @run.period.strftime("%Y-%m") &&
          PayrollSources::MonthlyFacts.current_snapshot?(source, company: @run.company, employment:)

        calculation = line["calculation_snapshot"]
        return ["calculation_missing_or_inconsistent"] unless calculation && calculation_matches?(calculation, line, employment)

        issues = calculation["review_ready"] ? [] : ["calculation_requires_review"]
        source.fetch("review_exceptions").each do |exception|
          unless resolved?(exception, line, source, calculation)
            issues << "source_exception:#{exception.fetch('code')}"
          end
        end
        issues
      end

      def calculation_matches?(calculation, line, employment)
        return false unless PayrollCalculation::Calculator.verify_snapshot?(calculation) && calculation["preview_only"] == true
        return false unless calculation_binding_matches?(calculation, line, employment)

        currency = Money::Currency.find(@run.currency)
        return false unless currency

        expected = expected_minor_amounts(calculation, currency.subunit_to_unit)
        expected && line["amounts"] == expected && components_match?(calculation, line, currency.subunit_to_unit)
      rescue ArgumentError, KeyError, TypeError
        false
      end

      def calculation_binding_matches?(calculation, line, employment)
        return false unless calculation.values_at("company_id", "person_id", "period", "currency") ==
          [@run.company_id.to_s, employment.user_id.to_s, @run.period.strftime("%Y-%m"), @run.currency]
        return false unless calculation.dig("input", "engagement_type") == line["pay_type"]
        source = line["source_snapshot"]
        return false unless calculation.dig("input", "quantity_source") == source["digest"]
        return false unless calculation.dig("policy", "version") == @payload.dig("policies", "pay", "version")

        source["pay_policy_version"] == @payload.dig("policies", "pay", "version") &&
          source["attendance_policy_version"] == @payload.dig("policies", "proration", "version")
      end

      def expected_minor_amounts(calculation, multiplier)
        expected = { "base_minor" => 0, "extras_minor" => 0, "reimbursements_minor" => 0, "deductions_minor" => 0 }
        calculation.fetch("lines").each do |entry|
          kind = entry.fetch("kind")
          field = amount_field(kind)
          amount = BigDecimal(entry.fetch("amount")) * multiplier
          return nil unless amount.frac.zero?

          expected[field] += amount.to_i
        end
        net = BigDecimal(calculation.fetch("net")) * multiplier
        net.frac.zero? ? expected.merge("net_minor" => net.to_i) : nil
      end

      def amount_field(kind)
        case kind
        when "base" then "base_minor"
        when "reimbursement" then "reimbursements_minor"
        else PayrollCalculation::Calculator::DEDUCTIONS.include?(kind) ? "deductions_minor" : "extras_minor"
        end
      end

      def components_match?(calculation, line, multiplier)
        expected = calculation["lines"].reject { |entry| entry["kind"] == "base" }.map do |entry|
          [entry["code"], amount_field(entry["kind"]), (BigDecimal(entry["amount"]) * multiplier).to_i,
           "#{entry['origin_period']}-01", entry["source"], entry["reason"]]
        end
        actual = %w[extras reimbursements deductions].flat_map do |kind|
          line[kind].map do |entry|
            [entry["code"], "#{kind}_minor", entry["amount_minor"], entry["origin_period"], entry["source_reference"], entry["reason_code"]]
          end
        end
        expected.sort == actual.sort
      end

      def resolved?(exception, line, source, calculation)
        decisions = {
          "no_timeoff_entries" => "verified_zero_pto",
          "timeoff_pay_classification_required" => "reviewed_day_mapping",
          "work_review_required" => "reviewed_override"
        }
        decision = decisions[exception["code"]]
        return false unless decision
        if exception["code"] == "timeoff_pay_classification_required"
          return false unless calculation.dig("input", "paid_quantity") && calculation.dig("input", "basis_quantity")
        end

        line["source_resolutions"].any? do |resolution|
          resolution["code"] == exception["code"] && resolution["source_id"] == exception["source_id"] &&
            resolution["decision"] == decision && resolution["source_digest"] == source["digest"] &&
            resolution["actor_id"] == @actor_id && @actor_id == @run.accounts_reviewer_id
        end
      end

      def valid_component?(entry)
        return false unless keys?(entry, %w[code amount_minor currency origin_period source_reference reason_code])
        return false unless %w[code source_reference reason_code].all? { |key| code?(entry[key]) }

        origin = Date.iso8601(entry["origin_period"])
        origin.day == 1 && minor?(entry["amount_minor"]) && entry["currency"] == @run.currency
      rescue Date::Error, TypeError
        false
      end

      def minor?(amount)
        amount.is_a?(Integer) && amount.between?(0, 9_000_000_000_000_000)
      end
  end
end
