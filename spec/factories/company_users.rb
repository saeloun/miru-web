# frozen_string_literal: true

FactoryBot.define do
  factory :company_user do
    company
    user
  end
end
