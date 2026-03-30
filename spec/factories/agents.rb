# frozen_string_literal: true

FactoryBot.define do
  factory :agent do
    company
    user { create(:user, current_workspace: company) }
    name { "Delivery Agent" }
    provider { "custom" }
    active { true }
    metadata { {} }
  end
end
