# frozen_string_literal: true

module PaymentProviders
  class CreateStripeProviderService < ApplicationService
    attr_reader :current_company

    def initialize(current_company)
      @current_company = current_company
    end

    def process
      current_company.payments_providers.create(
        {
          name: "stripe",
          connected: true,
          enabled: true,
          accepted_payment_methods: [ "card" ]
        }) if stripe_connected_account.present? && stripe_connected_account.details_submitted
    end

    private

      def stripe_connected_account
        current_company.stripe_connected_account
      end
  end
end
