# frozen_string_literal: true

FactoryBot.define do
  factory :device do
    model_name { "MyString" }
    model_version { "MyString" }
    model_id { "MyString" }
    kind { "MyString" }
    company_name { "MyString" }
    available { false }
    assignee { nil }
    company { nil }
    issued_to factory: :user
    issued_by factory: :company
    name { Faker::Alphanumeric.alphanumeric }
    serial_number { Faker::Alphanumeric.alphanumeric }
  end
end
