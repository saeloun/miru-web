# frozen_string_literal: true

class Payroll::ConsultantReview
  class InvalidInput < StandardError; end

  def self.period(month, cutoff, today:)
    raise InvalidInput, "Choose a payroll month" unless month.is_a?(String) && month.match?(/\A\d{4}-\d{2}\z/)
    raise InvalidInput, "Choose a cutoff date" unless cutoff.is_a?(String) && cutoff.match?(/\A\d{4}-\d{2}-\d{2}\z/)

    start = Date.iso8601("#{month}-01")
    date = Date.iso8601(cutoff)
    unless (1900..2099).cover?(start.year) && start <= today.beginning_of_month && date >= start && date <= today
      raise InvalidInput, "Month and cutoff must be valid and not in the future"
    end
    [start, date]
  rescue Date::Error
    raise InvalidInput, "Invalid month or cutoff date"
  end

  def initialize(employment:, month:, cutoff:, inputs: {})
    @employment, @month, @cutoff, @inputs = employment, month, cutoff, inputs
    @company = employment.company
    @finish = month.end_of_month
  end

  def process
    Payroll::Entitlement.require!(@company.id)
    terms = @employment.consultant_compensations.where("effective_on <= ?", @month).order(effective_on: :desc, id: :desc).first
    warnings = []
    work = work_summary(warnings)
    timeoff = TimeoffEntry.from_workspace(@company.id).where(user_id: @employment.user_id, leave_date: service_dates)
    leave_hours = timeoff.where(holiday_info_id: nil).sum(:duration).to_d / 60
    warnings << "timeoff_requires_review" if leave_hours.positive?
    unpaid = confirmed_unpaid_hours
    expected, fee = calculate_fee(terms, timeoff, work[:covered], unpaid, warnings)
    eligible, excluded, selected_ids, reimbursements = selected_reimbursements
    warnings << "expense_review_required" if excluded.any?
    {
      employment_id: @employment.id, consultant_name: @employment.user.full_name,
      month: @month.strftime("%Y-%m"), cutoff: @cutoff.iso8601, compensation_id: terms&.id,
      legal_entity_name: terms&.legal_entity_name, payment_source: terms&.payment_source,
      monthly_fee: money(terms&.monthly_fee), expected_hours: money(expected), recorded_hours: money(work[:hours].round(4)),
      approved_work_hours: money(work[:approved].round(4)), unresolved_work_hours: money(work[:unresolved].round(4)),
      not_required_work_hours: money(work[:not_required].round(4)),
      pending_work_hours: money(work[:pending].round(4)), rejected_work_hours: money(work[:rejected].round(4)),
      working_days: money((work[:hours] / 8).round(4)), recorded_timeoff_hours: money(leave_hours),
      approved_paid_hours: nil, opening_pto_hours: nil, closing_pto_hours: nil,
      confirmed_unpaid_hours: money(unpaid), unpaid_reason: @inputs[:unpaid_reason], fee_estimate: money(fee),
      reimbursement_total: money(reimbursements), total_estimate: money(fee && fee + reimbursements),
      withholding: nil, eligible_expenses: eligible.map { |expense| expense_details(expense) },
      excluded_expenses: excluded, selected_expense_ids: selected_ids,
      warnings:, payment_ready: false, claims_reserved: false
    }
  end

  private

    def work_summary(warnings)
      zero = 0.to_d
      work = TimesheetEntry.kept.in_workspace(@company).where(user_id: @employment.user_id, work_date: service_dates)
      hours = work.group(:review_status).sum(:duration).transform_values { |minutes| minutes.to_s.to_d / 60 }
      approved = hours.fetch("approved", zero)
      not_required = hours.fetch("not_required", zero)
      unresolved = hours.except("approved", "not_required").values.sum(zero)
      warnings << "work_requires_review" if unresolved.positive? || not_required.positive?
      { hours: hours.values.sum(zero), approved:, not_required:, unresolved:, covered: approved + not_required,
        pending: hours.fetch("pending_review", zero), rejected: hours.fetch("rejected", zero) }
    end

    def confirmed_unpaid_hours
      unpaid = decimal(@inputs[:confirmed_unpaid_hours].presence || "0")
      reason = @inputs[:unpaid_reason]
      if unpaid.positive? && (!reason.is_a?(String) || reason.strip.empty? || reason.length > 1000)
        raise InvalidInput, "Provide the reason for confirmed unpaid hours"
      end
      unpaid
    end

    def calculate_fee(terms, timeoff, covered, unpaid, warnings)
      unless terms
        warnings << "missing_terms"
        raise InvalidInput, "Configure terms before entering unpaid hours" if unpaid.positive?

        return [nil, nil]
      end
      expected = expected_hours(terms, timeoff)
      raise InvalidInput, "Unpaid hours cannot exceed expected hours" if unpaid > expected

      warnings.concat(fee_warnings(expected, covered, unpaid))
      blocking = %w[missing_service_dates partial_service terms_changed_during_month zero_expected_hours]
      fee = (terms.monthly_fee * (expected - unpaid) / expected).round(2) if (warnings & blocking).empty?
      [expected, fee]
    end

    def fee_warnings(expected, covered, unpaid)
      warnings = []
      warnings << "missing_service_dates" if @employment.joined_at.nil?
      warnings << "partial_service" if @employment.joined_at&.between?(@month + 1, @finish) || @employment.resigned_at&.between?(@month, @finish - 1)
      warnings << "terms_changed_during_month" if @employment.consultant_compensations.where(effective_on: (@month + 1)..@finish).exists?
      warnings << "zero_expected_hours" if expected.zero?
      warnings << "unexplained_hours" if (expected - covered - unpaid).round(4).positive?
      warnings
    end

    def selected_reimbursements
      eligible, excluded = expense_candidates
      selected_ids = expense_ids
      unless (selected_ids - eligible.map(&:id)).empty?
        raise InvalidInput, "Selected claims are no longer eligible; refresh the preview"
      end
      selected = eligible.select { |expense| selected_ids.include?(expense.id) }
      [eligible, excluded, selected_ids, selected.sum(0.to_d, &:amount)]
    end

    def service_dates
      @service_dates ||= [@month, @employment.joined_at || @month].max..[@finish, @employment.resigned_at || @finish].min
    end

    def expected_hours(terms, timeoff)
      national = HolidayInfo.kept.joins(:holiday).where(holidays: { company_id: @company.id, discarded_at: nil },
        category: :national, date: service_dates).pluck(:date)
      selected = timeoff.where.not(holiday_info_id: nil).joins(:holiday_info)
        .where(holiday_infos: { discarded_at: nil }).pluck("holiday_infos.date")
      holidays = (national + selected).uniq
      days = service_dates.count { |date| terms.weekdays.include?(date.cwday) && !holidays.include?(date) }
      days * terms.hours_per_day
    end

    def expense_candidates
      zone = @company.resolved_time_zone
      cutoff_time = zone.local(@cutoff.year, @cutoff.month, @cutoff.day).end_of_day
      candidates = @company.expenses.kept.where(user_id: @employment.user_id, status: :approved, paid_at: nil)
        .where("date <= ?", @cutoff).includes(receipts_attachments: :blob).order(:date, :id)
      eligible = []
      excluded = Hash.new(0)
      candidates.each do |expense|
        reason = if expense.approved_at.nil?
          "unknown_approval_time"
        elsif expense.approved_at > cutoff_time
          "approved_after_cutoff"
        elsif expense.currency != "INR"
          "foreign_currency"
        end
        reason ? excluded[reason] += 1 : eligible << expense
      end
      [eligible, excluded]
    end

    def expense_ids
      ids = @inputs[:expense_ids] || []
      unless ids.is_a?(Array) && ids.size <= 100 && ids.all? { |id| id.to_s.match?(/\A[1-9]\d*\z/) }
        raise InvalidInput, "Select valid reimbursement claims"
      end
      ids = ids.map(&:to_i)
      raise InvalidInput, "Select each reimbursement only once" unless ids.uniq.size == ids.size

      ids
    end

    def decimal(value)
      unless value.is_a?(String) && value.match?(/\A\d{1,6}(\.\d{1,2})?\z/)
        raise InvalidInput, "Unpaid hours must be a nonnegative decimal with up to two places"
      end
      value.to_d
    end

    def money(value)
      value&.to_d&.to_s("F")
    end

    def expense_details(expense)
      { id: expense.id, date: expense.date.iso8601, description: expense.description, currency: expense.currency,
        amount: money(expense.amount), approved_at: expense.approved_at.iso8601, receipt_count: expense.receipts.size }
    end
end
