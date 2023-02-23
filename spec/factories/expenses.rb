# frozen_string_literal: true

FactoryBot.define do
  factory :expense do
    amount { Faker::Number.between(from: 1.0, to: 1000.0).round(2) }
    expense_type { [:personal, :business].sample }
    date { Faker::Time.between(from: 60.days.ago, to: Time.now) }
    description { Faker::Lorem.paragraphs(number: rand(2..8)).join('\n') }
    company
    expense_category

    trait :with_receipts do
      after :build do |expense|
        file_name = "test-image.png"
        file_path = Rails.root.join("spec", "support", "fixtures", file_name)
        expense.receipts.attach(io: File.open(file_path), filename: file_name, content_type: "image/png")
      end
    end
  end
end
