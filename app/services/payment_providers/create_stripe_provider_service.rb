# frozen_string_literal: true

class PaymentProviders::CreateStripeProviderService < ApplicationService
  attr_reader :current_company
  STRIPE_PROVIDER = "stripe"
  ACCEPTED_PAYMENT_METHODS = ["card"]

  def initialize(current_company)
    @current_company = current_company
  end

  def process
    current_company.payments_providers.create(
      {
        name: STRIPE_PROVIDER,
        connected: true,
        enabled: true,
        accepted_payment_methods: ACCEPTED_PAYMENT_METHODS
      }) if stripe_connected_account.present? && stripe_connected_account.details_submitted
  end

  private

    def stripe_connected_account
      current_company.stripe_connected_account
    end
end
