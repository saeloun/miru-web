# frozen_string_literal: true

class InternalApi::V1::PaymentSettingsController < InternalApi::V1::ApplicationController
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
