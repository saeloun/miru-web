# frozen_string_literal: true

class PaymentSettingsController < ApplicationController
  def index
    authorize :index, policy_class: PaymentSettingsPolicy
  end

  def refresh_stripe_connect
    authorize :refresh_stripe_connect, policy_class: PaymentSettingsPolicy

    redirect_to stripe_connected_account.url, allow_other_host: true
  end

  private
    def stripe_connected_account
      StripeConnectedAccount.find_by!(company: current_company)
    end
end
