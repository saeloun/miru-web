# frozen_string_literal: true

class WeeklyReminderForMissedEntriesService
  def process
    Company.find_each do |company|
      company.users.kept.find_each do |user|
        notification_preference = NotificationPreference.find_by(user_id: user.id, company_id: company.id)

        if notification_preference&.can_receive_weekly_reminder?
          check_entries_and_send_mail(user, company, notification_preference)
        end
      end
    end
  end

  def check_entries_and_send_mail(user, company, notification_preference = nil)
    return unless user_is_admin_or_employee?(user, company)

    notification_preference ||= NotificationPreference.find_by(user_id: user.id, company_id: company.id)
    return if notification_preference.blank?

    name = user.full_name
    company_name = company.name
    start_date, end_date = previous_week_date_range

    limit = weekly_limit(company:)

    timesheet_entries, timeoff_entries = get_entries_for_period(
      user:,
      company:,
      start_date:,
      end_date:
    )
    entries_total_duration = total_duration_in_minutes(
      company:,
      timesheet_entries:,
      timeoff_entries:
    )

    if entries_total_duration < limit
      send_weekly_reminder_once(
        notification_preference:,
        recipients: user.email,
        name:,
        start_date:,
        end_date:,
        company_name:
      )
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

    # This lock makes the weekly reminder idempotent per user/company/week,
    # even if the scheduled job is triggered multiple times across environments.
    def send_weekly_reminder_once(notification_preference:, recipients:, name:, start_date:, end_date:, company_name:)
      notification_preference.with_lock do
        return if notification_preference.weekly_reminder_last_sent_for_week_start == start_date

        send_mail(recipients:, name:, start_date:, end_date:, company_name:)
        notification_preference.update!(weekly_reminder_last_sent_for_week_start: start_date)
      end
    end

    def get_entries_for_period(user:, company:, start_date:, end_date:)
      [
        user.timesheet_entries.kept.in_workspace(company).during(start_date, end_date),
        user.timeoff_entries.during(start_date, end_date)
      ]
    end

    def weekly_limit(company:)
      return 0 if company.working_hours.to_i == 0

      company.working_hours.to_i.hours.in_minutes
    end

    # Some older/imported workspaces stored timesheet durations in hours
    # while the current app stores durations in minutes. Normalize before
    # comparing against weekly limits to avoid false reminder emails.
    def total_duration_in_minutes(company:, timesheet_entries:, timeoff_entries:)
      normalized_timesheet_total = normalize_timesheet_duration(
        company:,
        timesheet_entries:
      )
      timeoff_total = timeoff_entries.sum(&:duration).to_f

      normalized_timesheet_total + timeoff_total
    end

    def normalize_timesheet_duration(company:, timesheet_entries:)
      total = timesheet_entries.sum(&:duration).to_f

      return total unless durations_recorded_in_hours?(company:, timesheet_entries:, total:)

      total * 60
    end

    def durations_recorded_in_hours?(company:, timesheet_entries:, total:)
      return false if timesheet_entries.blank?

      working_days = company.working_days.to_i
      working_days = 5 if working_days.zero?
      entries_count = timesheet_entries.size

      entries_count <= working_days + 2 &&
        timesheet_entries.all? { |entry| entry.duration.to_f <= 24 } &&
        total <= company.working_hours.to_f * 1.5
    end

    def previous_week_date_range
      previous_week = Time.zone.today.prev_week
      [previous_week.beginning_of_week, previous_week.end_of_week]
    end
end
