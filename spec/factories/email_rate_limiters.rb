# frozen_string_literal: true

FactoryBot.define do
  factory :email_rate_limiter do
    current_interval_started_at { Time.current - 30.minutes }
    number_of_emails_sent { 0 }
    user
  end
end
