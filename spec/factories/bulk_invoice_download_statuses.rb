# frozen_string_literal: true

FactoryBot.define do
  factory :bulk_invoice_download_status do
    download_id { Faker::Alphanumeric.unique.alpha(number: 10) }
    status { "processing" }
    file_url { nil }
  end
end
