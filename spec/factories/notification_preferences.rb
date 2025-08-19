# frozen_string_literal: true

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
