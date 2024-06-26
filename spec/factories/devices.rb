# frozen_string_literal: true

FactoryBot.define do
  factory :device do
    issued_to factory: :user
    issued_by factory: :company
    name { Faker::Alphanumeric.alphanumeric }
    serial_number { Faker::Alphanumeric.alphanumeric }
  end
end
