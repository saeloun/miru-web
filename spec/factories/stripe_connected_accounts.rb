# frozen_string_literal: true

# == Schema Information
#
# Table name: stripe_connected_accounts
#
#  id         :bigint           not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  account_id :string           not null
#  company_id :bigint           not null
#
# Indexes
#
#  index_stripe_connected_accounts_on_account_id  (account_id) UNIQUE
#  index_stripe_connected_accounts_on_company_id  (company_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
FactoryBot.define do
  factory :stripe_connected_account do
    association :company, factory: :company
    account_id { "acct_#{Faker::Alphanumeric.unique.alphanumeric(number: 16)}" }
  end
end
