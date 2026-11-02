# frozen_string_literal: true

module EmployeeReports
  class Row
    def initialize(employment:, month:, monthly_values:)
      @employment = employment
      @month = month
      @monthly_values = monthly_values
      @user = employment.user
    end

    def value(key)
      return private_details[key].is_a?(Array) ? private_details[key].to_json : private_details[key] if EmployeeRecord::DETAIL_KEYS.include?(key)
      return @employment.public_send(key) if %w[employee_id designation employment_type joined_at].include?(key)
      return @user.public_send(key) if %w[email date_of_birth phone personal_email_id].include?(key)

      public_send(key)
    end

    def name
      [@user.first_name, @user.last_name].join(" ")
    end

    def addresses
      @user.addresses.map { |address| address.slice(:address_type, :address_line_1, :address_line_2, :city, :state, :country, :pin) }.to_json
    end

    def social_accounts
      @user.social_accounts.to_json
    end

    def recorded_time_off_minutes
      @monthly_values.fetch("recorded_time_off_minutes").fetch(@user.id, 0)
    end

    def recorded_work_minutes
      @monthly_values.fetch("recorded_work_minutes").fetch(@user.id, BigDecimal("0"))
    end

    def calendar_weekdays
      return if @employment.joined_at.nil?

      @month.all_month.count do |date|
        date.on_weekday? && date >= @employment.joined_at && (@employment.resigned_at.nil? || date <= @employment.resigned_at)
      end
    end

    def recorded_working_days
      @monthly_values.fetch("recorded_working_days").fetch(@user.id, 0)
    end

    def national_holiday_dates
      @monthly_values.fetch("national_holiday_dates")
    end

    def paid_reimbursements
      reimbursements("paid_reimbursements")
    end

    def approved_reimbursements
      reimbursements("approved_reimbursements")
    end

    private

      def private_details
        @private_details ||= (@employment.employee_record || @employment.build_employee_record).details_with_defaults
      end

      def reimbursements(key)
        @monthly_values.fetch(key).fetch(@user.id, {}).transform_values do |amount|
          whole, fraction = amount.round(2).to_s("F").split(".")
          "#{whole}.#{fraction.ljust(2, '0')}"
        end.sort.to_h.to_json
      end
  end
end
