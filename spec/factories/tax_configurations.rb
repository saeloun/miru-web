# frozen_string_literal: true

FactoryBot.define do
  factory :tax_configuration do
    company
    sequence(:name) { |n| "Tax #{n}" }
    calculation_method { "percentage" }
    value { 9 }
  end
end
