# frozen_string_literal: true

class IndiaTax::SalaryEstimate
  include PayrollCalculation::Values

  class InvalidInput < ArgumentError; end

  PERIODS = {
    "2025-26" => { "label" => "FY 2025–26 / AY 2026–27", "act" => "Income-tax Act, 1961" }.freeze,
    "2026-27" => { "label" => "Tax Year 2026–27", "act" => "Income-tax Act, 2025" }.freeze
  }.freeze
  AGE_EXEMPTIONS = { "under_60" => 250000, "60_to_79" => 300000, "80_plus" => 500000 }.freeze
  INPUTS = %w[tax_year currency age_group gross_salary taxable_interest deductions employer_pensions
    scope_confirmed eligibility_confirmed].freeze
  DEDUCTIONS = %w[investments employee_nps additional_nps personal_nps_paid pension_salary professional_tax
    health_self health_parents eligible_interest].freeze
  HEALTH_FLAGS = %w[family_senior parents_senior].freeze
  SOURCES = [
    "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1",
    "https://www.incometaxindia.gov.in/documents/d/guest/income_tax_act_2025_as_amended_by_fa_act_2026-pdf"
  ].freeze

  def initialize(input)
    schema(input, INPUTS, "tax estimate")
    @input = immutable(input)
  rescue ArgumentError => error
    raise InvalidInput, error.message
  end

  def inspect
    "#<#{self.class.name} [FILTERED]>"
  end

  def call
    validate_inputs
    regimes = %w[old new].index_with { |name| calculate(name) }
    difference = BigDecimal(regimes["old"]["annual_tax"]) - BigDecimal(regimes["new"]["annual_tax"])
    period = PERIODS.fetch(@input["tax_year"])
    immutable({ "rule_version" => "india_salary_#{@input['tax_year']}_v1", "tax_year" => @input["tax_year"],
      "period_label" => period["label"], "governing_act" => period["act"], "currency" => "INR",
      "regimes" => regimes, "preferred_regime" => difference.zero? ? "same" : (difference.positive? ? "new" : "old"),
      "annual_saving" => formatted(difference.abs), "legal_references" => legal_references,
      "sources" => SOURCES, "estimate_only" => true, "payroll_ready" => false })
  rescue KeyError => error
    raise InvalidInput, "Missing tax estimate field: #{error.key}"
  end

  private

    def validate_inputs
      validate_profile
      @salary = amount(@input.fetch("gross_salary"), "gross salary")
      @interest = amount(@input.fetch("taxable_interest"), "taxable interest")
      validate_deductions
      validate_employer_pensions
      if @deductions["pension_salary"] > @salary - @employer_pensions.sum(0.to_d) { |row| row["contribution"] }
        raise ArgumentError, "Qualifying pension salary cannot exceed gross salary excluding employer contributions"
      end
    rescue ArgumentError => error
      raise InvalidInput, error.message
    end

    def validate_profile
      raise ArgumentError, "Choose a supported tax year" unless PERIODS.key?(@input["tax_year"])
      raise ArgumentError, "Only INR estimates are supported" unless @input["currency"] == "INR"
      raise ArgumentError, "Choose a resident age group" unless AGE_EXEMPTIONS.key?(@input["age_group"])
      unless @input["scope_confirmed"] == true && @input["eligibility_confirmed"] == true
        raise ArgumentError, "Confirm the supported income profile and deduction eligibility before calculating"
      end
    end

    def validate_deductions
      deductions = @input.fetch("deductions")
      schema(deductions, DEDUCTIONS + HEALTH_FLAGS, "deductions")
      HEALTH_FLAGS.each { |field| boolean(deductions[field], field) if deductions.key?(field) }
      @deductions = DEDUCTIONS.index_with { |field| amount(deductions.fetch(field, "0"), field) }
      raise ArgumentError, "Eligible interest cannot exceed taxable interest" if @deductions["eligible_interest"] > @interest
      if @deductions["employee_nps"] + @deductions["additional_nps"] > @deductions["personal_nps_paid"]
        raise ArgumentError, "Personal pension allocations cannot exceed contributions paid or reuse the same contribution"
      end
      if @deductions["employee_nps"].positive? && @deductions["pension_salary"].zero?
        raise ArgumentError, "Provide qualifying salary for employee pension contributions"
      end
    end

    def validate_employer_pensions
      rows = @input.fetch("employer_pensions")
      raise ArgumentError, "Provide at most ten employer pension entries" unless rows.is_a?(Array) && rows.size <= 10

      @employer_pensions = rows.map do |row|
        schema(row, %w[contribution salary_basis government], "employer pension")
        contribution = amount(row.fetch("contribution"), "employer pension contribution")
        salary = amount(row.fetch("salary_basis"), "employer pension salary basis")
        government = boolean(row.fetch("government"), "government employer")
        raise ArgumentError, "Provide qualifying salary for each employer pension" if contribution.positive? && salary.zero?

        { "contribution" => contribution, "salary_basis" => salary, "government" => government }
      end
      if @employer_pensions.sum(0.to_d) { |row| row["salary_basis"] + row["contribution"] } > @salary
        raise ArgumentError, "Employer pension contributions and qualifying salary must be included in gross salary"
      end
    end

    def amount(value, field)
      unless value.is_a?(String) && value.match?(/\A\d{1,11}(?:\.\d{1,2})?\z/)
        raise ArgumentError, "#{field} must be a nonnegative INR decimal string with at most two places"
      end
      BigDecimal(value)
    end

    def boolean(value, field)
      raise ArgumentError, "#{field} must be true or false" unless value == true || value == false

      value
    end

    def calculate(name)
      old = name == "old"
      standard = [@salary, (old ? 50000 : 75000).to_d].min
      professional = old ? [@deductions["professional_tax"], @salary - standard].min : 0.to_d
      gross_total = @salary - standard - professional + @interest
      remaining = gross_total
      lines = [deduction_line("standard_deduction", standard, standard),
        deduction_line("professional_tax", @deductions["professional_tax"], professional)]
      chapter_candidates(old).each do |code, claimed, ceiling|
        allowed = [claimed, ceiling, remaining].min
        remaining -= allowed
        lines << deduction_line(code, claimed, allowed)
      end
      income = nearest_ten(remaining)
      { "salary_deductions" => formatted(standard + professional), "gross_total_income" => formatted(gross_total),
        "chapter_deductions" => formatted(gross_total - remaining), "taxable_income" => formatted(income),
        "deductions" => lines }.merge(tax_summary(income, name))
    end

    def tax_summary(income, name)
      old = name == "old"
      tax = slab_tax(income, name)
      rebate_limit = old ? 500000 : 1200000
      rebate = income <= rebate_limit ? [tax, (old ? 12500 : 60000).to_d].min : 0.to_d
      rebate_relief = !old && income > rebate_limit ? [tax - (income - rebate_limit), 0.to_d].max : 0.to_d
      after_rebate = tax - rebate - rebate_relief
      surcharge, surcharge_relief = surcharge(income, after_rebate, name)
      cess = (after_rebate + surcharge) * BigDecimal("0.04")
      { "slab_tax" => formatted(tax), "rebate" => formatted(rebate), "rebate_marginal_relief" => formatted(rebate_relief),
        "surcharge" => formatted(surcharge), "surcharge_marginal_relief" => formatted(surcharge_relief),
        "cess" => formatted(cess), "annual_tax" => formatted(nearest_ten(after_rebate + surcharge + cess)) }
    end

    def chapter_candidates(old)
      investments = [@deductions["investments"], 150000].min
      employee_pension = [@deductions["pension_salary"] * BigDecimal("0.10"), 150000 - investments].min
      employer_paid = @employer_pensions.sum(0.to_d) { |row| row["contribution"] }
      employer_allowed = @employer_pensions.sum(0.to_d) do |row|
        rate = !old || row["government"] ? BigDecimal("0.14") : BigDecimal("0.10")
        [row["contribution"], row["salary_basis"] * rate].min
      end
      personal = [
        ["investments", @deductions["investments"], 150000],
        ["employee_nps", @deductions["employee_nps"], employee_pension],
        ["additional_nps", @deductions["additional_nps"], 50000],
        ["health_self", @deductions["health_self"], @input["deductions"]["family_senior"] ? 50000 : 25000],
        ["health_parents", @deductions["health_parents"], @input["deductions"]["parents_senior"] ? 50000 : 25000],
        ["eligible_interest", @deductions["eligible_interest"], @input["age_group"] == "under_60" ? 10000 : 50000]
      ]
      [["employer_nps", employer_paid, employer_allowed]] + personal.map { |code, claimed, ceiling| [code, claimed, old ? ceiling : 0.to_d] }
    end

    def deduction_line(code, claimed, allowed)
      { "code" => code, "claimed" => formatted(claimed.to_d), "allowed" => formatted(allowed.to_d) }
    end

    def slab_tax(income, name)
      bands = if name == "old"
        [[AGE_EXEMPTIONS.fetch(@input["age_group"]), "0"], [500000, "0.05"], [1000000, "0.20"], [nil, "0.30"]]
      else
        [[400000, "0"], [800000, "0.05"], [1200000, "0.10"], [1600000, "0.15"],
          [2000000, "0.20"], [2400000, "0.25"], [nil, "0.30"]]
      end
      lower = 0.to_d
      tax = 0.to_d
      bands.each do |upper, rate|
        break if income <= lower

        tax += ([income, upper || income].min - lower) * BigDecimal(rate)
        lower = upper || income
      end
      tax
    end

    def surcharge(income, tax, name)
      thresholds = [[5000000, "0.10"], [10000000, "0.15"], [20000000, "0.25"]]
      thresholds << [50000000, "0.37"] if name == "old"
      index = thresholds.rindex { |threshold, _rate| income > threshold }
      return [0.to_d, 0.to_d] unless index

      threshold, rate = thresholds[index]
      previous_rate = index.zero? ? 0.to_d : BigDecimal(thresholds[index - 1][1])
      ordinary = tax * BigDecimal(rate)
      ceiling = slab_tax(threshold.to_d, name) * (1 + previous_rate) + income - threshold
      relief = [tax + ordinary - ceiling, 0.to_d].max
      [ordinary - relief, relief]
    end

    def nearest_ten(value)
      # Section 516 / legacy 288A–288B discard paise before testing the last rupee digit.
      ((value.to_i + 5) / 10 * 10).to_d
    end

    def legal_references
      current = @input["tax_year"] == "2026-27"
      { "standard_deduction" => current ? "19(1), Table 2" : "16(ia)",
        "professional_tax" => current ? "19(1), Table 1" : "16(iii)",
        "investments" => current ? "123 / Schedule XV" : "80C / 80CCC / 80CCE",
        "employee_nps" => current ? "123 / Schedule XV(1)(y)" : "80CCD(1) / 80CCE",
        "additional_nps" => current ? "124(3)" : "80CCD(1B)",
        "employer_nps" => current ? "124(1)–(2)" : "80CCD(2)",
        "health_self" => current ? "126" : "80D", "health_parents" => current ? "126" : "80D",
        "eligible_interest" => current ? "153" : (@input["age_group"] == "under_60" ? "80TTA" : "80TTB"),
        "rebate" => current ? "156" : "87A", "new_regime" => current ? "202" : "115BAC",
        "rounding" => current ? "516" : "288A / 288B" }
    end
end
