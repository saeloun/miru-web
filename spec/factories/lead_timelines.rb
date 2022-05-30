# frozen_string_literal: true

FactoryBot.define do
  factory :lead_timeline do
    lead { nil }
    kind { 1 }
    comment { "MyText" }
  end
end
