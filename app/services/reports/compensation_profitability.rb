# frozen_string_literal: true

module Reports
  class CompensationProfitability
    class InvalidFilters < StandardError; end
    CURRENCIES = %w[INR USD].freeze
    PRORATIONS = %w[calendar_days working_days].freeze
    PERIODS = %w[month quarter financial_year calendar_year custom].freeze

    def initialize(user:, company:, filters: {})
      raise Pundit::NotAuthorizedError unless CompensationProfitabilityPolicy.new(user, company).show?

      @company = company
      @filters = filters.to_h.stringify_keys.slice("period", "anchor", "from", "to", "currency", "person_id",
        "primary_project_id", "client_id", "department", "status")
      @currency = @filters["currency"].presence || "INR"
      @period = @filters["period"].presence || "month"
      validate_filters!
      @from, @to = dates
      @exchange_rates_used = {}
      @fx_cache = {}
    end

    attr_reader :filters

    def process
      # A snapshot keeps displayed totals and details consistent during concurrent time/compensation edits.
      transaction_options = ApplicationRecord.connection.transaction_open? ? {} : { isolation: :repeatable_read }
      ApplicationRecord.transaction(**transaction_options) do
        load_sources
        current = period_result(@from, @to)
        previous = period_result(*previous_dates)
        current.merge(
          title: "Compensation Burn and Profitability", currency: @currency,
          generated_at: Time.current.iso8601, filters: @filters,
          proration: @company.compensation_proration,
          comparison: previous,
          exchange_rates: @exchange_rates_used.values,
          notes: ["INR and USD salary columns show the same cost; do not add them together.",
            "Days to Yearly Salary estimates revenue equivalence, not collections or company-wide profitability.",
            "Only approved timesheets are included. Operating expenses are excluded.",
            "Compensation is prorated by the configured payroll policy; holidays and recorded leave remain paid."]
        )
      end
    end

    private

      def validate_filters!
        raise InvalidFilters, "Unsupported currency or period" unless CURRENCIES.include?(@currency) && PERIODS.include?(@period)
        if @filters["status"].present? && !%w[active exited archived].include?(@filters["status"])
          raise InvalidFilters, "Unsupported employment status"
        end
        %w[person_id primary_project_id client_id].each do |key|
          next if @filters[key].blank?
          raise InvalidFilters, "Invalid #{key}" unless @filters[key].to_s.match?(/\A[1-9]\d{0,18}\z/)
        end
        raise InvalidFilters, "Invalid department" if @filters["department"].to_s.length > 100
      end

      def parse_date(value)
        raise InvalidFilters, "Use ISO dates (YYYY-MM-DD)" unless value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}\z/)

        Date.iso8601(value)
      rescue Date::Error
        raise InvalidFilters, "Invalid reporting date"
      end

      def dates
        anchor = @filters["anchor"].present? ? parse_date(@filters["anchor"]) : Date.current
        range = case @period
                when "month" then [anchor.beginning_of_month, anchor.end_of_month]
                when "quarter" then [anchor.beginning_of_quarter, anchor.end_of_quarter]
                when "calendar_year" then [anchor.beginning_of_year, anchor.end_of_year]
                when "financial_year"
                  end_month = Date::MONTHNAMES.index(@company.fiscal_year_end)
                  raise InvalidFilters, "Configure the financial year end month" unless end_month

                  finish = Date.new(anchor.year, end_month, -1)
                  finish = finish.next_year if anchor > finish
                  [finish.prev_year + 1, finish]
                else [parse_date(@filters["from"]), parse_date(@filters["to"])]
        end
        unless range.first <= range.last && range.last - range.first <= 366 && range.all? { |date| (1900..2099).cover?(date.year) }
          raise InvalidFilters, "Choose an ordered reporting range of at most one year"
        end
        range
      end

      def previous_dates
        case @period
        when "month" then [@from.prev_month, @from.prev_month.end_of_month]
        when "quarter" then [@from.prev_month(3), @from - 1]
        when "calendar_year", "financial_year" then [@from.prev_year, @from - 1]
        else [@from - (@to - @from + 1), @from - 1]
        end
      end

      def load_sources
        @employments = @company.employments.includes({ user: :roles }, :employee_record, :profitability_profile,
          :compensation_versions, :consultant_compensations).order(:user_id, :id).to_a
        earliest = previous_dates.first
        user_ids = @employments.map(&:user_id)
        @entries = TimesheetEntry.kept.in_workspace(@company).where(user_id: user_ids, work_date: earliest..@to)
          .includes(project: :client).to_a.group_by(&:user_id)
        @billing_rates = ProfitabilityBillingRate.joins(project: :client).where(clients: { company_id: @company.id })
          .where("effective_on <= ?", @to).order(:effective_on, :id).to_a.group_by { |rate| [rate.user_id, rate.project_id] }
        @projects_by_id = @company.projects.includes(:client).index_by(&:id)
        @assignments = ProjectMember.where(project_id: @projects_by_id.keys).to_a.group_by(&:user_id)
        @national_holidays = HolidayInfo.kept.joins(:holiday).where(holidays: { company_id: @company.id, discarded_at: nil },
          category: :national, date: earliest..@to).pluck(:date)
        @timeoff = TimeoffEntry.from_workspace(@company.id).where(user_id: user_ids, leave_date: earliest..@to)
          .includes(:holiday_info).to_a.group_by(&:user_id)
        @fx_rates = ExchangeRate.where("date <= ?", @to).order(:date, :id).to_a.group_by { |rate| [rate.from_currency, rate.to_currency] }
      end

      def period_result(from, to)
        rows = @employments.filter_map do |employment|
          person_result(employment, from, to) if reportable_employment?(employment, from, to)
        end
        rows = one_row_per_person(rows).select { |row| matches_filters?(row) }
        {
          from: from.iso8601, to: to.iso8601, people: rows,
          summary: summarize(rows),
          incomplete: rows.any? { |row| row[:flags].any? },
          provisional: to > Date.current,
          available_departments: @employments.filter_map { |e| e.profitability_profile&.department.presence }.uniq.sort
        }
      end

      def reportable_employment?(employment, from, to)
        roles = employment.user.roles.filter_map { |role| role.name if role.resource_type == "Company" && role.resource_id == @company.id }.uniq
        return false if roles == ["client"] && employment.employee_record.nil? && employment.consultant_compensations.empty? && employment.compensation_versions.empty?
        return false if employment.joined_at && employment.joined_at > to
        return false if employment.resigned_at && employment.resigned_at < from

        true
      end

      def one_row_per_person(rows)
        rows.group_by { |row| row[:person_id] }.map do |_person_id, records|
          next records.first if records.one?

          # Overlapping or repeated employment records need reconciliation before attributing costs and hours.
          row = records.last.merge(flags: (records.flat_map { |record| record[:flags] } + ["multiple_employment_records_require_review"]).uniq,
            client_ids: records.flat_map { |record| record[:client_ids] }.uniq, projects: [])
          %i[total_hours billable_hours available_hours utilization effective_rate annual_compensation days_to_yearly_salary
            salary_inr salary_usd compensation_cost revenue margin margin_percentage].each { |key| row[key] = nil }
          row
        end
      end

      def person_result(employment, from, to)
        flags = []
        flags << "missing_joining_date" unless employment.joined_at
        flags << "archived_employment_missing_exit_date" if employment.discarded_at && employment.resigned_at.nil?
        start = [from, employment.joined_at || from].max
        finish = [to, employment.resigned_at || to].min
        approved = approved_entries(employment, start, finish, flags)
        projects = project_results(employment, approved, flags)
        totals = compensation_and_availability(employment, start, finish, flags)
        finances = person_finances(employment, approved, projects, totals, finish, flags)
        if totals[:available_hours] && totals[:available_hours].positive? && start <= Date.current && approved.empty?
          flags << "timesheets_incomplete"
        end
        person_identity(employment, projects, from, to).merge(finances).merge(
          compensation_changes: compensation_changes(employment, start, finish), projects:, flags: flags.uniq.sort)
      end

      def approved_entries(employment, start, finish, flags)
        entries = @entries.fetch(employment.user_id, []).select { |entry| entry.work_date.between?(start, finish) }
        flags << "unapproved_hours_excluded" if entries.any? { |entry| !entry.approved? }
        approved = entries.select(&:approved?)
        flags << "missing_timesheets" if approved.empty?
        approved
      end

      def person_identity(employment, projects, from, to)
        primary_id = employment.profitability_profile&.primary_project_id ||
          projects.sort_by { |project| [-project[:total_hours], project[:project_id]] }.first&.dig(:project_id)
        primary = @projects_by_id[primary_id]
        client_ids = projects.pluck(:client_id) + [primary&.client_id]
        @assignments.fetch(employment.user_id, []).each do |assignment|
          next if assignment.created_at.to_date > to || (assignment.discarded_at && assignment.discarded_at.to_date < from)

          client_ids << @projects_by_id[assignment.project_id]&.client_id
        end
        {
          employment_id: employment.id, person_id: employment.user_id, person: employment.user.full_name,
          primary_project_id: primary_id, primary_project: primary&.name, client_ids: client_ids.compact.uniq,
          department: employment.profitability_profile&.department,
          status: employment.discarded_at ? "archived" : (employment.resigned_at && employment.resigned_at <= to ? "exited" : "active")
        }
      end

      def person_finances(employment, approved, projects, totals, finish, flags)
        revenue = complete_sum(projects, :revenue)
        cost = totals[:compensation_cost]
        margin = revenue && cost && revenue - cost
        billable = approved.reject(&:non_billable?).sum(0.to_d) { |entry| entry.duration.to_s.to_d / 60 }
        effective_rate = ratio(revenue, billable)
        annual = annual_compensation(employment, finish)
        annual_reporting = annual && convert(annual[:amount], annual[:currency], @currency, finish, flags)
        hours_per_day = totals[:scheduled_days].positive? ? totals[:scheduled_hours] / totals[:scheduled_days] : nil
        {
          total_hours: approved.sum(0.to_d) { |entry| entry.duration.to_s.to_d / 60 }, billable_hours: billable,
          available_hours: totals[:available_hours], utilization: percentage(billable, totals[:available_hours]),
          effective_rate:, annual_compensation: annual&.dig(:amount), compensation_currency: annual&.dig(:currency),
          days_to_yearly_salary: ratio(annual_reporting, effective_rate && hours_per_day && effective_rate * hours_per_day),
          salary_inr: totals[:salary_inr], salary_usd: totals[:salary_usd], compensation_cost: cost,
          revenue:, margin:, margin_percentage: percentage(margin, revenue)
        }
      end

      def compensation_terms(employment)
        @compensation_terms ||= {}
        @compensation_terms[employment.id] ||= begin
          employee = employment.compensation_versions.map { |version| [version.effective_on, version.id, version.salary_details] }
          # Existing encrypted salaries remain usable; do not invent history before their explicit effective date.
          if (details = employment.employee_record&.private_details)
            date = EmployeeRecord.iso_date?(details["salary_effective_on"])
            employee << [date, 0, details.slice(*EmployeeRecord::SALARY_KEYS)] if date
          end
          employee.sort_by { |date, id, _details| [date, id] }
        end
      end

      def compensation_at(employment, date)
        consultants = employment.consultant_compensations.sort_by { |terms| [terms.effective_on, terms.id] }
        terms = consultants.reverse.find { |item| item.effective_on <= date }
        version = compensation_terms(employment).reverse.find { |effective, _id, _details| effective <= date }
        if terms && (!version || terms.effective_on >= version.first)
          return { monthly: terms.monthly_fee, currency: "INR", weekdays: terms.weekdays, hours: terms.hours_per_day,
            source: "consultant_compensation", effective_on: terms.effective_on }
        end
        return unless version

        details = version.last
        return unless EmployeeRecord.iso_date?(details["salary_effective_on"]) &&
          details["salary_amount"].to_s.match?(EmployeeRecord::AMOUNT_FORMAT) && details["salary_amount"].to_d.positive? &&
          EmployeeRecord.supported_currency?(details["salary_currency"]) && %w[monthly annual].include?(details["salary_frequency"])

        monthly = details["salary_amount"].to_d
        monthly /= 12 if details["salary_frequency"] == "annual"
        annual = details["salary_frequency"] == "annual" ? details["salary_amount"].to_d : monthly * 12
        { monthly:, annual:, currency: details["salary_currency"], source: "employee_record", effective_on: version.first }
      end

      def schedule(employment, terms, flags)
        return [terms[:weekdays], terms[:hours]] if terms && terms[:weekdays]

        profile = employment.profitability_profile
        if profile && profile.weekdays.any? && profile.hours_per_day
          return [profile.weekdays, profile.hours_per_day]
        end
        # Miru stores the weekly count, not weekday identities; require an explicit personal schedule.
        flags << "missing_working_schedule"
        [[], nil]
      end

      def compensation_and_availability(employment, start, finish, flags)
        zero = 0.to_d
        results = { compensation_cost: zero, salary_inr: zero, salary_usd: zero,
          available_hours: zero, scheduled_days: 0, scheduled_hours: zero }
        flags << "missing_payroll_proration_policy" unless PRORATIONS.include?(@company.compensation_proration)
        holidays, leave = timeoff_for(employment, start, finish, flags)
        (start..finish).each do |date|
          terms = compensation_at(employment, date)
          flags << "missing_compensation" unless terms
          weekdays, hours = schedule(employment, terms, flags)
          add_daily_availability(results, date, weekdays, hours, holidays, leave)
          add_daily_compensation(results, terms, date, weekdays, flags)
        end
        if employment.joined_at.nil? || (employment.discarded_at && employment.resigned_at.nil?)
          results.merge!(compensation_cost: nil, salary_inr: nil, salary_usd: nil, available_hours: nil)
        end
        results[:available_hours] = nil if leave.any? || flags.include?("holiday_requires_review")
        results
      end

      def add_daily_availability(results, date, weekdays, hours, holidays, leave)
        unless hours
          results[:available_hours] = nil
          return
        end
        return unless weekdays.include?(date.cwday)

        results[:scheduled_days] += 1
        results[:scheduled_hours] += hours
        zero = 0.to_d
        available = holidays.include?(date) ? zero : [hours - leave.fetch(date, zero), zero].max
        results[:available_hours] += available if results[:available_hours]
      end

      def add_daily_compensation(results, terms, date, weekdays, flags)
        cost = daily_cost(terms, date, weekdays)
        { compensation_cost: @currency, salary_inr: "INR", salary_usd: "USD" }.each do |field, target|
          amount = cost && convert(cost, terms[:currency], target, date, flags)
          results[field] = results[field] && amount && results[field] + amount
        end
      end

      def daily_cost(terms, date, weekdays)
        return unless terms && PRORATIONS.include?(@company.compensation_proration)
        return terms[:monthly] / date.end_of_month.day if @company.compensation_proration == "calendar_days"
        return if weekdays.empty?
        return 0.to_d unless weekdays.include?(date.cwday)

        days = (date.beginning_of_month..date.end_of_month).count { |day| weekdays.include?(day.cwday) }
        terms[:monthly] / days
      end

      def timeoff_for(employment, start, finish, flags)
        holidays = @national_holidays.dup
        leave = Hash.new(0.to_d)
        @timeoff.fetch(employment.user_id, []).each do |entry|
          next unless entry.leave_date.between?(start, finish)
          if entry.holiday_info
            if entry.holiday_info.date != entry.leave_date || entry.holiday_info.discarded_at
              flags << "holiday_requires_review"
            else
              holidays << entry.leave_date
            end
          else
            # Miru's timeoff records have no approval state. Keep utilization unavailable until reviewed.
            flags << "leave_approval_unavailable"
            leave[entry.leave_date] += entry.duration.to_d / 60
          end
        end
        [holidays, leave]
      end

      def project_results(employment, entries, flags)
        entries.group_by(&:project_id).map do |project_id, project_entries|
          project = project_entries.first.project
          details = project_entries.map { |entry| entry_result(employment, entry, flags) }
          { project_id:, project: project.name, client_id: project.client_id, client: project.client.name,
            total_hours: details.sum { |entry| entry[:hours] },
            billable_hours: details.select { |entry| entry[:billable] }.sum(0.to_d) { |entry| entry[:hours] },
            revenue: complete_sum(details, :revenue), entries: details }
        end
      end

      def entry_result(employment, entry, flags)
        rate = @billing_rates.fetch([employment.user_id, entry.project_id], []).reverse.find { |item| item.effective_on <= entry.work_date }
        { date: entry.work_date.iso8601, hours: entry.duration.to_s.to_d / 60, billable: !entry.non_billable?,
          hourly_rate: rate&.hourly_rate, rate_currency: rate&.currency, rate_effective_on: rate&.effective_on&.iso8601,
          billing_method: rate&.billing_method, revenue: entry_revenue(entry, rate, flags) }
      end

      def entry_revenue(entry, rate, flags)
        return 0.to_d if entry.non_billable?
        if rate.nil?
          flags << "missing_effective_billing_rate"
          return
        end
        if rate.billing_method == "fixed_fee"
          flags << "fixed_fee_allocation_unavailable"
          return
        end
        convert(entry.duration.to_s.to_d / 60 * rate.hourly_rate, rate.currency, @currency, entry.work_date, flags)
      end

      def annual_compensation(employment, date)
        terms = compensation_at(employment, date)
        terms && { amount: terms[:annual] || terms[:monthly] * 12, currency: terms[:currency] }
      end

      def compensation_changes(employment, start, finish)
        dates = [start] + compensation_terms(employment).map(&:first) + employment.consultant_compensations.map(&:effective_on)
        dates.uniq.sort.filter_map do |date|
          next unless date.between?(start, finish)
          terms = compensation_at(employment, date)
          { effective_on: terms&.dig(:effective_on)&.iso8601 || date.iso8601, monthly_amount: terms&.dig(:monthly),
            currency: terms&.dig(:currency), source: terms&.dig(:source) }
        end
      end

      def convert(amount, source, target, date, flags)
        return amount if source == target

        fx = exchange_rate(source, target, date)
        unless fx
          flags << "missing_exchange_rate_#{source}_#{target}"
          return
        end
        @exchange_rates_used[[source, target, fx[:date], fx[:rate]]] = fx
        amount * fx[:rate]
      end

      def exchange_rate(source, target, date)
        key = [source, target, date]
        return @fx_cache[key] if @fx_cache.key?(key)

        direct = @fx_rates.fetch([source, target], []).reverse.find { |rate| rate.date <= date }
        reverse = @fx_rates.fetch([target, source], []).reverse.find { |rate| rate.date <= date } unless direct
        record = direct || reverse
        @fx_cache[key] = if record
          { from: source, to: target, rate: direct ? record.rate : 1.to_d / record.rate,
            date: record.date.iso8601, source: record.source, inverse: direct.nil? }
        end
      end

      def matches_filters?(row)
        (@filters["person_id"].blank? || row[:person_id].to_s == @filters["person_id"].to_s) &&
          (@filters["primary_project_id"].blank? || row[:primary_project_id].to_s == @filters["primary_project_id"].to_s) &&
          (@filters["client_id"].blank? || row[:client_ids].map(&:to_s).include?(@filters["client_id"].to_s)) &&
          (@filters["department"].blank? || row[:department] == @filters["department"]) &&
          (@filters["status"].blank? || row[:status] == @filters["status"])
      end

      def summarize(rows)
        cost = complete_sum(rows, :compensation_cost)
        revenue = complete_sum(rows, :revenue)
        margin = cost && revenue && revenue - cost
        available = complete_sum(rows, :available_hours)
        billable = complete_sum(rows, :billable_hours)
        { people: rows.size, gross_compensation_burn: cost, revenue:, net_compensation_burn: margin && -margin,
          overall_margin: margin, overall_margin_percentage: percentage(margin, revenue),
          billable_hours: billable, available_hours: available, overall_utilization: percentage(billable, available) }
      end

      def complete_sum(rows, key)
        return if rows.any? { |row| row[key].nil? }

        rows.sum(0.to_d) { |row| row[key] }
      end

      def ratio(numerator, denominator)
        numerator / denominator if numerator && denominator && denominator.positive?
      end

      def percentage(numerator, denominator)
        value = ratio(numerator, denominator)
        value && value * 100
      end
  end
end
