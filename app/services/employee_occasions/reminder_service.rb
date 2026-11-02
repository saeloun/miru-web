# frozen_string_literal: true

module EmployeeOccasions
  class ReminderService
    def initialize(company:)
      @company = company
      @today = Time.current.in_time_zone(company.resolved_time_zone).to_date
      @event_on = @today + 7
    end

    def process
      return unless enabled?

      active_employments.includes(:user).find_each do |employment|
        events(employment).each do |kind|
          admins.find_each { |admin| deliver(employment, admin, kind) }
        end
      end
    end

    private

      def enabled?
        EmployeeRecordSetting.exists?(company: @company, occasion_reminders_enabled: true)
      end

      def active_employments
        Employment.kept.joins(:user).merge(User.kept).where(company: @company)
          .where("joined_at IS NULL OR joined_at <= ?", @today)
          .where("resigned_at IS NULL OR resigned_at >= ?", @today)
          .where(user_id: staff_users)
      end

      def staff_users
        User.joins(:roles).where(roles: { resource_type: "Company", resource_id: @company.id,
          name: EmployeeRecordPolicy::STAFF_ROLES }).select(:id)
      end

      def admins
        User.kept.joins(:roles).where(id: active_employments.select(:user_id),
          roles: { resource_type: "Company", resource_id: @company.id, name: %w[owner admin] }).distinct
      end

      def events(employment)
        dates = { "birthday" => employment.user.date_of_birth, "work_anniversary" => employment.joined_at }
        dates.filter_map do |kind, date|
          kind if date && date.year < @event_on.year && anniversary(date) == @event_on
        end
      end

      def anniversary(date)
        day = [date.day, Date.new(@event_on.year, date.month, -1).day].min
        Date.new(@event_on.year, date.month, day)
      end

      def deliver(employment, admin, kind)
        employment.with_lock do
          next unless enabled? && active_employments.exists?(id: employment.id) && admins.exists?(id: admin.id)

          identity = { employment:, admin:, kind:, event_on: @event_on }
          next if EmployeeOccasionDelivery.exists?(identity)

          message = send_reminder(employment, admin, kind)
          next unless message&.perform_deliveries

          EmployeeOccasionDelivery.create!(**identity, delivered_at: Time.current)
        end
      end

      def send_reminder(employment, admin, kind)
        EmployeeOccasionMailer.reminder(employment:, admin:, kind:, event_on: @event_on).deliver_now
      rescue Postmark::Error, Net::SMTPError, IOError, Timeout::Error, SocketError, SystemCallError,
          OpenSSL::SSL::SSLError => exception
        Rails.logger.warn(event: "employee_occasion_delivery_failed", company_id: @company.id,
          employment_id: employment.id, admin_id: admin.id, kind:, event_on: @event_on.iso8601,
          error_class: exception.class.name)
        nil
      end
  end
end
