# frozen_string_literal: true

FactoryBot.define do
  factory :employee_record do
    employment
    private_details { { "emergency_contact_name" => Faker::Name.name } }
  end
end
