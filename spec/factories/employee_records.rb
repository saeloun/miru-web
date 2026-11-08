# frozen_string_literal: true

FactoryBot.define do
  factory :employee_record do
    employment
    private_details { { "emergency_contact_name" => Faker::Name.name } }

    trait :with_bank_details do
      private_details { { "bank_account_number" => Faker::Number.number(digits: 16).to_s } }
    end
  end
end
