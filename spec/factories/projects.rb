# frozen_string_literal: true

FactoryBot.define do
  factory :project do
    client
    name { "Conduit" }
    description { "Blog site." }
    billable { false }

    after(:create) do |project, _evaluator|
      project.reindex(refresh: true)
    end
  end
end
