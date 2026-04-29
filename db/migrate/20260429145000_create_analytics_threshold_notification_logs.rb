# frozen_string_literal: true

class CreateAnalyticsThresholdNotificationLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :analytics_threshold_notification_logs do |t|
      t.references :company, null: false, foreign_key: true
      t.string :alert_type, null: false
      t.datetime :notified_at, null: false
      t.timestamps

      t.index [:company_id, :alert_type],
        unique: true,
        name: "index_analytics_threshold_logs_on_company_and_alert"
    end
  end
end
