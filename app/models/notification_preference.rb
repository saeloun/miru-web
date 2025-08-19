# frozen_string_literal: true

# == Schema Information
#
# Table name: notification_preferences
#
#  id                          :bigint           not null, primary key
#  invoice_email_notifications :boolean          default(TRUE), not null
#  notification_enabled        :boolean          default(FALSE), not null
#  payment_email_notifications :boolean          default(TRUE), not null
#  timesheet_reminder_enabled  :boolean          default(TRUE), not null
#  unsubscribed_from_all       :boolean          default(FALSE), not null
#  created_at                  :datetime         not null
#  updated_at                  :datetime         not null
#  company_id                  :bigint           not null
#  user_id                     :bigint           not null
#
# Indexes
#
#  index_notification_preferences_on_company_id              (company_id)
#  index_notification_preferences_on_user_id                 (user_id)
#  index_notification_preferences_on_user_id_and_company_id  (user_id,company_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
class NotificationPreference < ApplicationRecord
  belongs_to :user
  belongs_to :company

  validates :notification_enabled, inclusion: { in: [true, false] }

  # Check if user should receive any emails
  def can_receive_emails?
    !unsubscribed_from_all
  end

  # Check if user should receive weekly reminders
  def can_receive_weekly_reminder?
    can_receive_emails? && notification_enabled
  end

  # Check if user should receive invoice notifications
  def can_receive_invoice_notifications?
    can_receive_emails? && invoice_email_notifications
  end

  # Check if user should receive payment notifications
  def can_receive_payment_notifications?
    can_receive_emails? && payment_email_notifications
  end

  # Check if user should receive timesheet reminders
  def can_receive_timesheet_reminders?
    can_receive_emails? && timesheet_reminder_enabled
  end

  # Unsubscribe from all emails
  def unsubscribe_all!
    update!(unsubscribed_from_all: true)
  end

  # Re-subscribe with default settings
  def resubscribe!
    update!(
      unsubscribed_from_all: false,
      notification_enabled: true,
      invoice_email_notifications: true,
      payment_email_notifications: true,
      timesheet_reminder_enabled: true
    )
  end
end
