# frozen_string_literal: true

# == Schema Information
#
# Table name: currency_pairs
#
#  id              :bigint           not null, primary key
#  active          :boolean          default(TRUE)
#  from_currency   :string           not null
#  last_updated_at :datetime
#  rate            :decimal(20, 10)
#  to_currency     :string           not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
# Indexes
#
#  index_currency_pairs_on_active                         (active)
#  index_currency_pairs_on_from_currency_and_to_currency  (from_currency,to_currency) UNIQUE
#
FactoryBot.define do
  factory :currency_pair do
    from_currency { "USD" }
    to_currency { "EUR" }
    rate { 0.93 }
    active { true }
  end
end
