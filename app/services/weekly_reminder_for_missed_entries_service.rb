# frozen_string_literal: true

class WeeklyReminderForMissedEntriesService
  def process
    Company.find_each do |company|
      company.users.kept.find_each do |user|
        notification_preference = NotificationPreference.find_by(user_id: user.id, company_id: company.id)

        if notification_preference&.can_receive_weekly_reminder?
          check_entries_and_send_mail(user, company)
        end
      end
    end
  end

  def check_entries_and_send_mail(user, company)
    return unless user_is_admin_or_employee?(user, company)

    name = user.full_name
    company_name = company.name
    start_date, end_date = previous_week_date_range

    limit = weekly_limit(company:)

    entries = get_entries_for_period(user:, company:, start_date:, end_date:)

    entries_total_duration = entries.sum(&:duration)

    if entries_total_duration < limit
      send_mail(recipients: user.email, name:, start_date:, end_date:, company_name:)
    end
  end

  private

    def user_is_admin_or_employee?(user, company)
      user.has_role?(:admin, company) || user.has_role?(:employee, company)
    end

    def send_mail(recipients:, name:, start_date:, end_date:, company_name:)
      SendWeeklyReminderToUserMailer.with(
        recipients:,
        name:,
        start_date:,
        end_date:,
        company_name:
      ).notify_user_about_missed_entries.deliver_later
    end

    def get_entries_for_period(user:, company:, start_date:, end_date:)
      user.timesheet_entries.kept.in_workspace(company).during(start_date, end_date) +
        user.timeoff_entries.during(start_date, end_date)
    end

    def weekly_limit(company:)
      return 0 if company.working_hours.to_i == 0

      company.working_hours.to_i.hours.in_minutes
    end

    def previous_week_date_range
      previous_week = Time.zone.today.prev_week
      [previous_week.beginning_of_week, previous_week.end_of_week]
    end
end
