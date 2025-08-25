# frozen_string_literal: true

class Api::V1::PaymentSettingsController < Api::V1::ApplicationController
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

  def destroy
    authorize :destroy, policy_class: PaymentSettingsPolicy

    if stripe_connected_account.destroy
      render json: { notice: "Stripe connection disconnected" }, status: 200
    else
      render json: { error: "Unable to process the request" }, status: 422
    end
  end

  private

    def stripe_connected_account
      current_company.stripe_connected_account
    end

    def save_stripe_settings
      PaymentProviders::CreateStripeProviderService.process(current_company)
    end
end
