# frozen_string_literal: true

FactoryBot.define do
  factory :quickbooks_sync_run do
    company
    quickbooks_connection { association(:quickbooks_connection, company:) }
    direction { :bidirectional }
    trigger { :manual }
    status { :queued }
    summary { {} }
  end
end
