# frozen_string_literal: true

FactoryBot.define do
  factory :quickbooks_connection do
    company
    realm_id { Faker::Number.number(digits: 10).to_s }
    environment { :sandbox }
    status { :connected }
    access_token { "quickbooks-access-token" }
    refresh_token { "quickbooks-refresh-token" }
    access_token_expires_at { 1.hour.from_now }
    refresh_token_expires_at { 90.days.from_now }
    connected_at { Time.current }
    settings do
      {
        "company_name" => "QuickBooks Sandbox Company",
        "income_account_id" => "79",
        "service_item_id" => "1"
      }
    end
  end
end
