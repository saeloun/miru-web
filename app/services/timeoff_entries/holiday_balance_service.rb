# frozen_string_literal: true

module TimeoffEntries
  class HolidayBalanceService < ApplicationService
    def initialize(holiday:, user_id:, working_hours_per_day:)
      @holiday = holiday
      @user_id = user_id
      @working_hours_per_day = working_hours_per_day
    end

    def process
      return {
        leave_balance: [],
        optional_timeoff_entries: nil,
        national_timeoff_entries: nil
      } unless holiday

      {
        leave_balance: [
          national_holidays_summary,
          optional_holidays_summary
        ],
        optional_timeoff_entries:,
        national_timeoff_entries:
      }
    end

    private

      attr_reader :holiday, :user_id, :working_hours_per_day

      def national_timeoff_entries
        @national_timeoff_entries ||= holiday.national_timeoff_entries.where(user: user_id)
      end

      def optional_timeoff_entries
        @optional_timeoff_entries ||= holiday.optional_timeoff_entries.where(user: user_id)
      end

      def national_holidays_summary
        {
          id: "national",
          name: "National Holidays",
          icon: "national",
          color: "national",
          timeoff_entries_duration: national_timeoff_entries.sum(:duration),
          type: "holiday",
          category: "national",
          label: "#{national_timeoff_entries.count} out of #{holiday.holiday_infos.national.count}"
        }
      end

      def optional_holidays_summary
        no_of_allowed_optional_holidays = holiday.no_of_allowed_optional_holidays
        time_period_optional_holidays = holiday.time_period_optional_holidays

        total_optional_entries = TimeoffEntries::CalculateOptionalHolidayTimeoffEntriesService.new(
          time_period_optional_holidays,
          holiday.optional_timeoff_entries,
          Date.current,
          user_id
        ).process

        net_days =
          if total_optional_entries >= no_of_allowed_optional_holidays
            0
          else
            no_of_allowed_optional_holidays - total_optional_entries
          end

        {
          id: "optional",
          name: "Optional Holidays",
          icon: "optional",
          color: "optional",
          net_duration: net_days * 60 * working_hours_per_day,
          net_days:,
          timeoff_entries_duration: optional_timeoff_entries.sum(:duration),
          type: "holiday",
          category: "optional",
          label: "#{total_optional_entries} out of #{no_of_allowed_optional_holidays} (this #{time_period_optional_holidays.to_s.gsub("per_", "")})"
        }
      end
  end
end
