# frozen_string_literal: true

FactoryBot.define do
  factory :lead_line_item do
    lead { nil }
    name { "MyString" }
    kind { 1 }
    description { "MyText" }
    numbert_of_resource { 1 }
    resource_expertise_level { 1 }
    price { 1.5 }
  end
end
