# frozen_string_literal: true

FactoryBot.define do
  factory :device_usage do
    approve { false }
    created_by { nil }
    device { nil }
    assignee { nil }
  end
end
