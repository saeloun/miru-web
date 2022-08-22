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
  end
end
