# frozen_string_literal: true

FactoryBot.define do
  factory :custom_leave_user do
    custom_leave
    user
  end
end
