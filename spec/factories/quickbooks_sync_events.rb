# frozen_string_literal: true

FactoryBot.define do
  factory :quickbooks_sync_event do
    company
    quickbooks_connection { association(:quickbooks_connection, company:) }
    source { :webhook }
    quickbooks_entity_type { "Invoice" }
    quickbooks_entity_id { Faker::Number.number(digits: 6).to_s }
    operation { "Update" }
    payload_digest { SecureRandom.hex(16) }
    event_time { Time.current }
    status { :pending }
  end
end
