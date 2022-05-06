# == Schema Information
#
# Table name: stripe_connected_accounts
#
#  id         :integer          not null, primary key
#  account_id :string           not null
#  company_id :integer          not null
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
# Indexes
#
#  index_stripe_connected_accounts_on_account_id  (account_id) UNIQUE
#  index_stripe_connected_accounts_on_company_id  (company_id)
#

# frozen_string_literal: true

class StripeConnectedAccount < ApplicationRecord
  belongs_to :company

  validates :account_id, uniqueness: true
end
