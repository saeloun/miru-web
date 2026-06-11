# frozen_string_literal: true

FactoryBot.define do
  factory :quickbooks_reference do
    company
    quickbooks_connection { association(:quickbooks_connection, company:) }
    miru_record { association(:client, company:) }
    quickbooks_entity_type { "Customer" }
    quickbooks_entity_id { Faker::Number.number(digits: 6).to_s }
    quickbooks_sync_token { "0" }
    direction { :bidirectional }
    status { :synced }
  end
end
