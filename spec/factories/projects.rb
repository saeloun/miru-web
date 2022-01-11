# frozen_string_literal: true

FactoryBot.define do
  factory :project do
    client
    company
    name { "Conduit" }
    description { "Blog site." }
  end
end
