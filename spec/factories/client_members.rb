# frozen_string_literal: true

FactoryBot.define do
  factory :client_member do
    user
    client
    company
  end
end
