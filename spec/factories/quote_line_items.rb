# frozen_string_literal: true

FactoryBot.define do
  factory :quote_line_item do
    name { "MyString" }
    description { "MyText" }
    comment { "MyText" }
    estimated_hours { "" }
    lead_line_item { nil }
  end
end
