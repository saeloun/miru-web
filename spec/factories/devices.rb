# frozen_string_literal: true

FactoryBot.define do
  factory :device do
    issued_to factory: :user
    issued_by factory: :company
    model { Faker::Alphanumeric.alphanumeric }
    serial_number { Faker::Number.number(digits: 100) }
  end
end
