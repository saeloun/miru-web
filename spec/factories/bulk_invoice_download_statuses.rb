# frozen_string_literal: true

# == Schema Information
#
# Table name: bulk_invoice_download_statuses
#
#  id          :bigint           not null, primary key
#  file_url    :string
#  status      :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  download_id :string
#
FactoryBot.define do
  factory :bulk_invoice_download_status do
    download_id { Faker::Alphanumeric.unique.alpha(number: 10) }
    status { "processing" }
    file_url { nil }
  end
end
