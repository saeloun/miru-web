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
FactoryBot.define do
  factory :notification_preference do
    association :user
    association :company
    notification_enabled { false }
    invoice_email_notifications { true }
    payment_email_notifications { true }
    timesheet_reminder_enabled { true }
    unsubscribed_from_all { false }

    trait :all_enabled do
      notification_enabled { true }
      invoice_email_notifications { true }
      payment_email_notifications { true }
      timesheet_reminder_enabled { true }
      unsubscribed_from_all { false }
    end

    trait :all_disabled do
      notification_enabled { false }
      invoice_email_notifications { false }
      payment_email_notifications { false }
      timesheet_reminder_enabled { false }
      unsubscribed_from_all { false }
    end

    trait :unsubscribed do
      unsubscribed_from_all { true }
    end

    trait :weekly_reminder_only do
      notification_enabled { true }
      invoice_email_notifications { false }
      payment_email_notifications { false }
      timesheet_reminder_enabled { false }
      unsubscribed_from_all { false }
    end

    trait :billing_only do
      notification_enabled { false }
      invoice_email_notifications { true }
      payment_email_notifications { true }
      timesheet_reminder_enabled { false }
      unsubscribed_from_all { false }
    end
  end
end
