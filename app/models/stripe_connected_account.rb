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
#  index_stripe_connected_accounts_on_company_id  (company_id) UNIQUE
#

# frozen_string_literal: true

class StripeConnectedAccount < ApplicationRecord
  before_create do
    self.account_id = Stripe::Account.create(type: "standard").id
  end

  belongs_to :company

  validates :account_id, uniqueness: true

  def retrieve
    Stripe::Account.retrieve(self.account_id)
  end

  def details_submitted
    retrieve.details_submitted
  end

  def url
    Stripe::AccountLink.create(
      type: "account_onboarding",
      account: self.account_id,
      refresh_url: "#{ENV['APP_BASE_URL']}/internal_api/v1/payment/settings/stripe/connect/refresh",
      return_url: "#{ENV['APP_BASE_URL']}/payments/settings"
    ).url unless retrieve.details_submitted
  end
end
