# frozen_string_literal: true

FactoryBot.define do
  factory :expense_category do
    name { Faker::Name.name }
    company
  end
end
