# frozen_string_literal: true

class Api::V1::PaymentSettingsController < Api::V1::ApplicationController
  before_action :authenticate_user!
  after_action :verify_authorized

  def index
    authorize :payment_setting, :index?

    stripe_settings = current_company.stripe_connected_account

    render json: {
      stripe: {
        connected: stripe_settings.present?,
        account_id: stripe_settings&.account_id,
        account_name: stripe_settings&.account_name,
        status: stripe_settings&.status || "not_connected"
      },
      providers: {
        stripe: {
          enabled: stripe_settings.present?,
          name: "Stripe",
          description: "Accept credit card payments"
        },
        paypal: {
          enabled: false,
          name: "PayPal",
          description: "Accept PayPal payments"
        },
        bank_transfer: {
          enabled: true,
          name: "Bank Transfer",
          description: "Accept bank transfers"
        }
      }
    }
  end

  def connect_stripe
    authorize :payment_setting, :update?

    # Placeholder for Stripe Connect flow
    # In a real implementation, this would initiate the Stripe Connect OAuth flow
    render json: {
      message: "Stripe Connect initiated",
      redirect_url: "#" # Would be actual Stripe Connect URL
    }
  end

  def destroy
    authorize :payment_setting, :destroy?

    stripe_account = current_company.stripe_connected_account
    if stripe_account&.destroy
      render json: { message: "Stripe account disconnected successfully" }
    else
      render json: { error: "Failed to disconnect Stripe account" }, status: :unprocessable_entity
    end
  end

  private

    def current_company
      @_current_company ||= current_user.current_workspace
    end
end
