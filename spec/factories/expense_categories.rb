# frozen_string_literal: true

FactoryBot.define do
  factory :expense_category do
    name { Faker::Name.name }
    icon { ["home", "settings"].sample }
  end
end
