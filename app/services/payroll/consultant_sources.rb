# frozen_string_literal: true

class Payroll::ConsultantSources
  attr_reader :company

  def initialize(company:, employments:, month:)
    @company = company
    @employment_ids = employments.map(&:id)
    @user_ids = employments.map(&:user_id)
    @period = month..month.end_of_month
  end

  def terms(employment_id)
    @terms ||= compensations.where("effective_on <= ?", @period.begin)
      .select("DISTINCT ON (employment_id) consultant_compensations.*")
      .order(:employment_id, effective_on: :desc, id: :desc).index_by(&:employment_id)
    @terms[employment_id]
  end

  def terms_changed?(employment_id)
    @changed ||= compensations.where(effective_on: (@period.begin + 1)..@period.end).distinct.pluck(:employment_id)
    @changed.include?(employment_id)
  end

  def work(user_id, dates)
    @work ||= TimesheetEntry.kept.in_workspace(company).where(user_id: @user_ids, work_date: @period)
      .pluck(:user_id, :work_date, :review_status, :duration).group_by(&:first)
    @work.fetch(user_id, []).filter_map do |_user, date, status, minutes|
      [status, minutes] if dates.cover?(date)
    end
  end

  def leave_durations(user_id, dates)
    @leave ||= timeoff.where(holiday_info_id: nil, leave_date: @period)
      .pluck(:user_id, :leave_date, :duration).group_by(&:first)
    @leave.fetch(user_id, []).filter_map { |_user, date, minutes| minutes if dates.cover?(date) }
  end

  def national_holidays(dates)
    @national ||= HolidayInfo.kept.joins(:holiday)
      .where(holidays: { company_id: company.id, discarded_at: nil }, category: :national, date: @period).pluck(:date)
    @national.select { |date| dates.cover?(date) }
  end

  def selected_holidays(user_id, dates)
    @selected ||= holiday_entries.where(leave_date: @period).or(holiday_entries.where(holiday_infos: { date: @period }))
      .pluck(:user_id, :leave_date, "holiday_infos.date").group_by(&:first)
    @selected.fetch(user_id, []).filter_map do |_user, recorded, configured|
      [recorded, configured] if dates.cover?(recorded) || dates.cover?(configured)
    end
  end

  private

    def compensations
      ConsultantCompensation.where(employment_id: @employment_ids)
    end

    def timeoff
      TimeoffEntry.from_workspace(company.id).where(user_id: @user_ids)
    end

    def holiday_entries
      timeoff.joins(:holiday_info)
        .where(holiday_infos: { discarded_at: nil }, holidays: { company_id: company.id, discarded_at: nil })
    end
end
