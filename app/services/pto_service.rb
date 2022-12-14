  # frozen_string_literal: true

  # DATA requirements
  # Employee
  # - List of monthly row PTO report

  # Fields required for PTO report

  # Month | Year |Expected Hour  | Hours Worked | Regional Holiday| National Holiday|Default PTO EARNED | PTO Used | Previous Month PTO  |PTO ADJUSTED TO SALARY | GRAND PTO TOTAL | PTO Dates for the Month | Notes |

  # MONTH = Jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec
  # YEAR = 2017|2018|2019|2020|2021|2022|2023|2024|2025|2026|2027|2028|2029|2030
  # EXPECTED HOUR = Number of working days (Monday to friday) * 8 (including holidays)
  # Hours Worked = Total Logged Hours
  # Regional Holiday = HR defined holidays taken (e.g. Holi, eid, etc) 1 Holiday = 8 hours per quarter
  # National Holiday = National holidays taken (e.g. 15th August, 26th January, etc) 1 Holiday = 8 hours (Fixed dates)
  # Default PTO EARNED = 16 hours per month (2 days) [probably can be adjustable as per user in future]
  # PTO Used = Total PTO used in the month (HR-PTO)
  # Previous Month PTO = PTO carried forward from previous month (Grand PTO of previous month)
  # PTO ADJUSTED TO SALARY = PTO adjusted to salary if PTO used is more than Grand PTO it can be adjusted through Salary
  # GRAND PTO TOTAL = Previous Month PTO + Default PTO EARNED - (PTO Used) **
  # PTO Dates for the Month = Dates of PTO taken in the month
  # Notes = Any notes for the month by Admin

  # **
  # PTO Used -
  #   Q: How to calculate PTO used?
  #   either only by HR-PTO or EXPECTED_HOUR - (Hours Worked + Regional Holiday + National Holiday)

  # -----------------------------
  # better to store data in table  instead of calculating it every time
  # Q: should store weekly of monthly data?

  class PtoService < ApplicationService # generate a monthly record and save it in database
    WORKING_HOUR_PER_DAY = 8
    def initialize(employee, month, year)
      @employee = employee
      @month = month
      @year = year
    end

    def expected_hours
      # If a Employee joined in the middle of the month then we need to calculate expected hours accordingly and not from start of month (@employee.joined_at)
      working_days_in_month * WORKING_HOUR_PER_DAY
    end

    def hours_worked
      timesheet_entries_of_user.sum(:duration)
    end

    private

      def start_of_month
        Date.new(@year, @month, 1)
      end

      def end_of_month
        Date.new(@year, @month, -1)
      end

      def working_days_in_month
        (start_of_month..end_of_month).count { |day| day.wday.between?(1, 5) }
      end

      def timesheet_entries_of_user
        @employee.user.timesheet_entries.where(work_date: start_of_month..end_of_month)
      end
  end
