# frozen_string_literal: true

class InternalApi::V1::PaymentSettingsController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: PaymentSettingsPolicy

    render json: {
      providers: {
        stripe: {
          connected: stripe_connected_account.nil? ? false : stripe_connected_account.details_submitted
        },
        paypal: {
          connected: false
        }
      }
    }
  end

  def connect_stripe
    authorize :connect_stripe, policy_class: PaymentSettingsPolicy

    StripeConnectedAccount.create!({ company: current_company }) if stripe_connected_account.nil?

    render json: { account_link: stripe_connected_account.url }
  end

  private

    def stripe_connected_account
      current_company.stripe_connected_account
    end
end
