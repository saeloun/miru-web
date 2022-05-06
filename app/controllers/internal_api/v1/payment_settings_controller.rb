# frozen_string_literal: true

class InternalApi::V1::PaymentSettingsController < InternalApi::V1::ApplicationController
  def connect_stripe
    authorize :connect_stripe, policy_class: PaymentSettingsPolicy

    account = Stripe::Account.create(type: "standard")

    StripeConnectedAccount.create(
      {
        account_id: account.id,
        company: current_company
      })

    account_link = Stripe::AccountLink.create(
      type: "account_onboarding",
      account: account.id,
      refresh_url: "#{ENV['APP_BASE_URL']}/internal_api/v1/payment/settings/stripe/connect/refresh",
      return_url: "#{ENV['APP_BASE_URL']}/payment/settings/stripe/connect/return"
    )

    render json: { account_link: account_link.url }
  end
end
