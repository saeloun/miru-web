# frozen_string_literal: true

class Api::V1::Payments::ProvidersController < ApplicationController
  after_action :save_stripe_settings, only: :index

  def index
    authorize :index, policy_class: Payments::ProviderPolicy
    render :index, locals: {
      payments_providers: current_company.payments_providers
    }
  end

  def update
    authorize :update, policy_class: Payments::ProviderPolicy
    payments_provider.update!(provider_params)
    render :update, locals: {
      payments_provider:
    }
  end

  private

    def payments_provider
      @_payments_provider ||= current_company.payments_providers.find(params[:id])
    end

    def provider_params
      params.require(:provider).permit(:name, :enabled, accepted_payment_methods: [])
    end

    def stripe_connected_account
      current_company.stripe_connected_account
    end

    def save_stripe_settings
      PaymentProviders::CreateStripeProviderService.process(current_company)
    end
end
