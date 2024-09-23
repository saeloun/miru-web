# frozen_string_literal: true

class PaymentSettingsController < ApplicationController
  def index
    authorize current_company, policy_class: PaymentSettingsPolicy
  end

  def refresh_stripe_connect
    authorize current_company, policy_class: PaymentSettingsPolicy

    redirect_to stripe_connected_account.url, allow_other_host: true
  end

  private

    def stripe_connected_account
      StripeConnectedAccount.find_by!(company: current_company)
    end
end
