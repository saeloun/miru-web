# frozen_string_literal: true

class AddWeeklyReminderLastSentForWeekStartToNotificationPreferences < ActiveRecord::Migration[8.1]
  def change
    add_column :notification_preferences, :weekly_reminder_last_sent_for_week_start, :date
  end
end
