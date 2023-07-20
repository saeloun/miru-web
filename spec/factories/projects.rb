# frozen_string_literal: true

FactoryBot.define do
  factory :project do
    client
    name { Faker::Name.unique.name[0..30] }
    description { "Blog site." }
    billable { false }
  end
end
