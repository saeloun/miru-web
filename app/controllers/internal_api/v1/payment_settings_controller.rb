# frozen_string_literal: true

class InternalApi::V1::PaymentSettingsController < InternalApi::V1::ApplicationController
  after_action :save_stripe_settings, only: :index

  def index
    authorize :index, policy_class: PaymentSettingsPolicy

    render :index, locals: { stripe_connected_account: }
  end

  def connect_stripe
    authorize :connect_stripe, policy_class: PaymentSettingsPolicy

    StripeConnectedAccount.create!({ company: current_company }) if stripe_connected_account.nil?

    render :connect_stripe, locals: { stripe_connected_account: }
  end

  private

    def stripe_connected_account
      current_company.stripe_connected_account
    end

    def save_stripe_settings
      current_company.payments_providers.create(
        {
          name: "stripe",
          connected: true,
          enabled: true,
          accepted_payment_methods: [ "card" ]
        }) if stripe_connected_account.present? && stripe_connected_account.details_submitted
    end
end
