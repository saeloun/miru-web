# frozen_string_literal: true

FactoryBot.define do
  factory :expense do
    amount { Faker::Number.between(from: 1.0, to: 1000.0).round(2) }
    expense_type { [:personal, :business].sample }
    date { Faker::Time.between(from: 60.days.ago, to: Time.now) }
    description { Faker::Lorem.paragraphs(number: rand(2..8)).join('\n') }
    company
    expense_category
  end
end
