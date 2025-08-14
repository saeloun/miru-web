# frozen_string_literal: true

class TimeoffEntries::IndexDecorator < ApplicationService
  attr_reader :current_user, :current_company, :user_id, :year

  def initialize(current_user, current_company, user_id, year)
    @current_user = current_user
    @current_company = current_company
    @user_id = user_id
    @year = year || Date.current.year
  end

  def process
    {
      timeoff_entries: timeoff_entries,
      employees: employees,
      leave_balance: leave_balance,
      total_timeoff_entries_duration: total_duration,
      optional_timeoff_entries: optional_timeoff_entries,
      national_timeoff_entries: national_timeoff_entries
    }
  end

  private

    def user
      @user ||= user_id.present? ? current_company.users.find(user_id) : current_user
    end

    def leave
      @leave ||= current_company.leaves.find_or_create_by!(year: year.to_i)
    end

    def timeoff_entries
      @timeoff_entries ||= user.timeoff_entries
        .kept
        .includes(:leave_type, :holiday_info)
        .where("EXTRACT(YEAR FROM leave_date) = ?", year.to_i)
        .order(leave_date: :desc)
    end

    def optional_timeoff_entries
      timeoff_entries.select { |entry| entry.holiday_info&.category == "optional" }
    end

    def national_timeoff_entries
      timeoff_entries.select { |entry| entry.holiday_info&.category == "national" }
    end

    def employees
      current_company.employees_without_client_role
    end

    def leave_balance
      leave.leave_types.map do |leave_type|
        used_days = calculate_used_days(leave_type)
        total_days = leave_type.allocation_value || 0

        {
          id: leave_type.id,
          name: leave_type.name,
          total_days: total_days,
          used_days: used_days,
          remaining_days: (total_days - used_days).round(2)
        }
      end
    end

    def calculate_used_days(leave_type)
      minutes = user.timeoff_entries
        .where(leave_type_id: leave_type.id)
        .where("EXTRACT(YEAR FROM leave_date) = ?", year.to_i)
        .kept
        .sum(:duration)

      (minutes / 480.0).round(2) # Convert minutes to days (480 minutes = 8 hours = 1 day)
    end

    def total_duration
      timeoff_entries.sum(:duration)
    end
end
