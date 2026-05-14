# frozen_string_literal: true

FactoryBot.define do
  factory :tax_configuration do
    company
    name { "GST" }
    calculation_method { "percentage" }
    value { 9 }
  end
end
