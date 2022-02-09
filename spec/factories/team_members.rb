# frozen_string_literal: true

FactoryBot.define do
  factory :team_member do
    user
    project
    hourly_rate { Faker::Number.decimal(l_digits: 3, r_digits: 2) }
  end
end
