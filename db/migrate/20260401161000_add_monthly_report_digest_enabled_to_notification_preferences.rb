# frozen_string_literal: true

class AddMonthlyReportDigestEnabledToNotificationPreferences < ActiveRecord::Migration[7.2]
  def change
    add_column :notification_preferences, :monthly_report_digest_enabled, :boolean, default: false, null: false
  end
end
