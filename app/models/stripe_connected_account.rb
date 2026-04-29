# frozen_string_literal: true

class StripeConnectedAccount < ApplicationRecord
  include Rails.application.routes.url_helpers

  before_create do
    self.account_id ||= Stripe::Account.create(type: "standard").id
  end

  belongs_to :company

  validates :account_id, uniqueness: true

  def details_submitted
    retrieve.details_submitted
  rescue Stripe::StripeError => e
    Rails.logger.warn(
      "Unable to retrieve Stripe connected account #{account_id}: #{e.class} - #{e.message}"
    )
    false
  end

  def url
    Stripe::AccountLink.create(
      type: "account_onboarding",
      account: self.account_id,
      refresh_url: payments_settings_stripe_connect_refresh_url(host: "#{ENV['APP_BASE_URL']}"),
      return_url: "#{ENV['APP_BASE_URL']}/settings/payment"
    ).url unless details_submitted
  end

  private

    def retrieve
      Stripe::Account.retrieve(self.account_id)
    end
end
