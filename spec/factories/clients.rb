# frozen_string_literal: true

FactoryBot.define do
  factory :client do
    name { "MyString" }
    email { "MyString" }
    phone { "MyString" }
    address { "MyString" }
    country { "MyString" }
    timezone { "MyString" }
  end
end
