# frozen_string_literal: true

FactoryBot.define do
  factory :project do
    client
    name { "Conduit" }
    description { "Blog site." }
    bill_status { "non_billable" }
  end
end
