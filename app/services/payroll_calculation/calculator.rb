# frozen_string_literal: true

require_relative "values"

module PayrollCalculation
  class Calculator
    include Values

    VERSION = "1"
    ADDITIONS = %w[arrears bonus profit_share reimbursement gst other_earning].freeze
    DEDUCTIONS = %w[professional_tax income_tax withholding advance_recovery other_deduction].freeze
    ROUNDING_STAGES = %w[monthly base fx net].freeze

    def self.verify_snapshot?(snapshot)
      new(policy: snapshot.fetch("policy"), input: snapshot.fetch("input")).call == snapshot
    rescue ArgumentError, KeyError, TypeError, NoMethodError
      false
    end

    def initialize(policy:, input:)
      raise ArgumentError, "policy and input must be objects" unless policy.is_a?(Hash) && input.is_a?(Hash)

      @policy = immutable(policy)
      @input = immutable(input)
      validate_schemas
    end

    def inspect
      "#<#{self.class.name} [REDACTED]>"
    end

    def call
      @issues = []
      validate_context
      lines = [base_line] + adjustments.map { |item| adjustment_line(item) }
      gross = component_total(lines.reject { |line| DEDUCTIONS.include?(line.fetch("kind")) })
      deductions = component_total(lines.select { |line| DEDUCTIONS.include?(line.fetch("kind")) })
      net = rounded(gross - deductions, "net")
      issue("negative_net") if net.negative?
      delta = manual_net_delta(net)
      immutable(result_context.merge("lines" => lines, "gross" => formatted(gross), "deductions" => formatted(deductions),
        "net" => formatted(net), "manual_net_delta" => delta && formatted(delta),
        "issues" => @issues.uniq.sort, "review_ready" => @issues.empty?, "preview_only" => true))
    rescue KeyError => error
      raise ArgumentError, "missing payroll field: #{error.key}"
    end

    private

      def result_context
        { "calculation_version" => VERSION, "policy" => @policy, "input" => @input,
          "company_id" => @input.fetch("company_id"), "person_id" => @input.fetch("person_id"),
          "period" => @input.fetch("period"), "currency" => @input.fetch("settlement_currency") }
      end

      def component_total(lines)
        lines.sum(BigDecimal("0")) { |line| BigDecimal(line.fetch("amount")) }
      end

      def base_line
        base = rounded(monthly_or_hourly_base, "base")
        { "code" => "base", "kind" => "base", "source_currency" => @input.fetch("source_currency"),
          "source_amount" => formatted(base), "currency" => @input.fetch("settlement_currency"),
          "amount" => formatted(convert(base, @input.fetch("source_currency"))) }
      end

      def adjustment_line(item)
        amount = convert(decimal(item.fetch("amount"), "adjustment amount"), currency(item.fetch("currency")))
        item.merge("amount" => formatted(amount), "source_amount" => item.fetch("amount"),
          "source_currency" => item.fetch("currency"), "currency" => @input.fetch("settlement_currency"))
      end

      def manual_net_delta(net)
        manual = @input["manual_net"]
        return unless manual

        delta = decimal(manual.fetch("amount"), "manual net", negative: true) - net
        raise ArgumentError, "manual net currency mismatch" unless currency(manual.fetch("currency")) == @input.fetch("settlement_currency")

        text(manual.fetch("reason"), "manual net reason")
        issue("manual_net_requires_review") unless manual["reviewed"] == true && manual["reviewed_by"].is_a?(String) && !manual["reviewed_by"].strip.empty?
        delta
      end

      def validate_schemas
        schema(@policy, %w[version effective_from effective_to reviewed formula_mapping_confirmed attendance_policy_confirmed
          deduction_policy_confirmed paid_quantity_name basis_quantity_name rounding fx], "policy")
        schema(@input, %w[company_id person_id period engagement_type source_currency settlement_currency compensation
          paid_quantity basis_quantity quantity_source adjustments hours hours_source hours_reviewed manual_net], "input")
        schema(@input.fetch("compensation"), %w[basis amount effective_from effective_to], "compensation")
        schema(@policy.fetch("rounding"), ROUNDING_STAGES, "rounding")
        ROUNDING_STAGES.each do |stage|
          schema(@policy.fetch("rounding").fetch(stage), %w[mode digits], "rounding profile")
        end
        schema(@policy.fetch("fx"), %w[from to rate direction as_of source reviewed], "FX") if @policy.key?("fx")
        schema(@input.fetch("manual_net"), %w[amount currency reason reviewed reviewed_by], "manual net") if @input.key?("manual_net")
        items = @input.fetch("adjustments")
        raise ArgumentError, "adjustments must be an array" unless items.is_a?(Array)

        items.each do |item|
          schema(item, %w[code kind amount currency origin_period source reason reviewed settlement_reference], "adjustment")
        end
      rescue KeyError => error
        raise ArgumentError, "missing payroll field: #{error.key}"
      end

      def issue(code)
        @issues << code
      end

      def validate_context
        %w[company_id person_id].each { |field| text(@input.fetch(field), field) }
        text(@policy.fetch("version"), "policy version")
        validate_effective_period
        raise ArgumentError, "unsupported engagement type" unless %w[employee consultant].include?(@input.fetch("engagement_type"))

        %w[source_currency settlement_currency].each { |field| currency(@input.fetch(field)) }
        %w[reviewed formula_mapping_confirmed attendance_policy_confirmed deduction_policy_confirmed].each do |field|
          issue("#{field}_required") unless @policy[field] == true
        end
        ROUNDING_STAGES.each { |stage| rounded(BigDecimal("0"), stage) }
      end

      def validate_effective_period
        period = @input.fetch("period")
        raise ArgumentError, "period must be YYYY-MM" unless period.is_a?(String) && period.match?(/\A\d{4}-\d{2}\z/)

        first = Date.iso8601("#{period}-01")
        last = first.next_month - 1
        issue("policy_not_effective_for_period") unless date(@policy.fetch("effective_from")) <= first && date(@policy.fetch("effective_to")) >= last
        terms = @input.fetch("compensation")
        issue("compensation_not_effective_for_period") unless date(terms.fetch("effective_from")) <= first && date(terms.fetch("effective_to")) >= last
      end

      def monthly_or_hourly_base
        terms = @input.fetch("compensation")
        rate = decimal(terms.fetch("amount"), "compensation amount")
        return hourly_base(rate) if terms.fetch("basis") == "hourly"

        raise ArgumentError, "unsupported compensation basis" unless %w[annual monthly].include?(terms.fetch("basis"))

        monthly = terms.fetch("basis") == "annual" ? rounded(rate.div(12, 40), "monthly") : rate
        prorated_base(monthly)
      end

      def hourly_base(rate)
        text(@input.fetch("hours_source"), "hours source")
        issue("hours_require_review") unless @input["hours_reviewed"] == true
        rate * decimal(@input.fetch("hours"), "hours")
      end

      def prorated_base(monthly)
        text(@policy.fetch("paid_quantity_name"), "paid quantity name")
        text(@policy.fetch("basis_quantity_name"), "basis quantity name")
        text(@input.fetch("quantity_source"), "quantity source")
        paid = decimal(@input.fetch("paid_quantity"), "paid quantity")
        basis = decimal(@input.fetch("basis_quantity"), "basis quantity")
        raise ArgumentError, "basis quantity must be positive" unless basis.positive?

        issue("quantity_above_basis") if paid > basis
        monthly.mult(paid, 0).div(basis, 40)
      end

      def rounded(amount, stage)
        profile = @policy.fetch("rounding").fetch(stage)
        raise ArgumentError, "only half_away_from_zero rounding is supported" unless profile.fetch("mode") == "half_away_from_zero"

        digits = profile.fetch("digits")
        raise ArgumentError, "rounding digits must be nil or 0..8" unless digits.nil? || (digits.is_a?(Integer) && digits.between?(0, 8))

        digits.nil? ? amount : amount.round(digits, BigDecimal::ROUND_HALF_UP)
      end

      def convert(amount, source_currency)
        return amount if source_currency == @input.fetch("settlement_currency")

        fx = @policy.fetch("fx")
        unless fx.fetch("from") == source_currency && fx.fetch("to") == @input.fetch("settlement_currency")
          raise ArgumentError, "FX currency pair mismatch"
        end
        text(fx.fetch("source"), "FX source")
        observed = date(fx.fetch("as_of"))
        issue("fx_date_after_period") if observed > Date.iso8601("#{@input.fetch('period')}-01").next_month - 1
        issue("fx_requires_review") unless fx["reviewed"] == true
        rate = decimal(fx.fetch("rate"), "FX rate")
        raise ArgumentError, "FX rate must be positive" unless rate.positive?

        converted = case fx.fetch("direction")
                    when "source_units_per_settlement_unit" then amount.div(rate, 40)
                    when "settlement_units_per_source_unit" then amount.mult(rate, 0)
                    else raise ArgumentError, "unsupported FX direction"
        end
        rounded(converted, "fx")
      end

      def adjustments
        items = @input.fetch("adjustments")
        raise ArgumentError, "adjustments must be an array" unless items.is_a?(Array)

        codes = []
        items.each do |item|
          code = text(item.fetch("code"), "adjustment code")
          raise ArgumentError, "duplicate adjustment code" if code == "base" || codes.include?(code)

          codes << code
          raise ArgumentError, "unsupported adjustment kind" unless (ADDITIONS + DEDUCTIONS).include?(item.fetch("kind"))

          %w[origin_period source reason].each { |field| text(item.fetch(field), field) }
          raise ArgumentError, "origin period must be YYYY-MM" unless item.fetch("origin_period").match?(/\A\d{4}-\d{2}\z/)

          Date.iso8601("#{item.fetch('origin_period')}-01")
          issue("adjustment_requires_review:#{code}") unless item["reviewed"] == true
          issue("already_settled:#{code}") if item["settlement_reference"]
        end
        items
      end
  end
end
