# frozen_string_literal: true

class AddNotificationFieldsToNotificationPreferences < ActiveRecord::Migration[8.0]
  def change
    # Add new notification preference fields
    add_column :notification_preferences, :invoice_email_notifications, :boolean, default: true, null: false
    add_column :notification_preferences, :payment_email_notifications, :boolean, default: true, null: false
    add_column :notification_preferences, :timesheet_reminder_enabled, :boolean, default: true, null: false
    add_column :notification_preferences, :unsubscribed_from_all, :boolean, default: false, null: false
  end
end
