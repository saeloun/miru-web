# frozen_string_literal: true

FactoryBot.define do
  factory :device_timeline do
    index_system_display_message { "MyText" }
    index_system_display_title { "MyText" }
    device { nil }
    action_subject { "MyString" }
  end
end
