# frozen_string_literal: true

class Payroll::ConsultantSources
  attr_reader :company

  def initialize(company:, employments:, month:)
    @company = company
    @employments = employments.index_by(&:id)
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
    work_rows.fetch(user_id, []).filter_map do |_user, _id, minutes, status, date, _updated|
      [status, minutes] if dates.cover?(date)
    end
  end

  def leave_durations(user_id, dates)
    leave_rows.fetch(user_id, []).filter_map do |_user, _id, minutes, date, _updated, holiday_id|
      minutes if holiday_id.nil? && dates.cover?(date)
    end
  end

  def work_fingerprint(user_id)
    work_rows.fetch(user_id, []).map { |row| row.drop(1) }
  end

  def leave_fingerprint(user_id)
    leave_rows.fetch(user_id, []).pluck(1..4)
  end

  def pto_policies(employment_id)
    @pto_policies ||= ConsultantPtoPolicy.where(company:, employment_id: @employment_ids).order(:effective_on, :id).map do |policy|
      policy.association(:employment).target = @employments.fetch(policy.employment_id)
      policy
    end.group_by(&:employment_id)
    @pto_policies.fetch(employment_id, [])
  end

  def pto_entries(employment_id)
    @pto_entries ||= PayrollPtoEntry.where(company:, employment_id: @employment_ids).order(:period, :id).group_by(&:employment_id)
    @pto_entries.fetch(employment_id, [])
  end

  def for_month(month)
    return self if month == @period.begin

    @months ||= {}
    @months[month] ||= self.class.new(company:, employments: @employments.values, month:)
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

    def work_rows
      @work ||= TimesheetEntry.kept.in_workspace(company).where(user_id: @user_ids, work_date: @period).order(:id)
        .pluck(:user_id, :id, :duration, :review_status, :work_date, :updated_at).group_by(&:first)
    end

    def leave_rows
      @leave ||= timeoff.where(leave_date: @period).order(:id)
        .pluck(:user_id, :id, :duration, :leave_date, :updated_at, :holiday_info_id).group_by(&:first)
    end

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
