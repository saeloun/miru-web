# frozen_string_literal: true

class Api::V1::PaymentSettingsController < Api::V1::ApplicationController
  after_action :save_stripe_settings, only: :index

  def index
    authorize :index, policy_class: PaymentSettingsPolicy

    render :index, locals: { stripe_connected_account:, upi_provider: }
  end

  def connect_stripe
    authorize :connect_stripe, policy_class: PaymentSettingsPolicy

    account = StripeConnectedAccount.find_or_create_by!(company: current_company)

    render :connect_stripe, locals: { stripe_connected_account: account }
  rescue ActiveRecord::RecordNotUnique
    render :connect_stripe, locals: { stripe_connected_account: current_company.reload.stripe_connected_account }
  end

  def destroy
    authorize :destroy, policy_class: PaymentSettingsPolicy

    if stripe_connected_account&.destroy
      render json: { message: "Stripe account disconnected successfully" }, status: 200
    else
      render json: { error: "Failed to disconnect Stripe account" }, status: 422
    end
  end

  def update_upi
    authorize :update_upi, policy_class: PaymentSettingsPolicy

    upi_provider.assign_attributes(upi_provider_attributes)

    if upi_provider.save
      render :index, locals: { stripe_connected_account:, upi_provider: }
    else
      render json: { errors: upi_provider.errors.to_hash(true) }, status: 422
    end
  end

  private

    def stripe_connected_account
      current_company.stripe_connected_account
    end

    def upi_provider
      @_upi_provider ||= current_company.payments_providers.find_or_initialize_by(name: PaymentsProvider::UPI_PROVIDER)
    end

    def upi_params
      params.require(:provider).permit(
        :enabled,
        :upi_id,
        :payee_name,
        :merchant_category_code,
        :enabled_on_invoices
      )
    end

    def upi_provider_attributes
      enabled = boolean_type.cast(upi_params[:enabled])
      upi_id = upi_params[:upi_id].to_s.strip

      {
        connected: upi_id.present?,
        enabled:,
        accepted_payment_methods: ["upi"],
        upi_id:,
        payee_name: upi_params[:payee_name].to_s.strip,
        merchant_category_code: upi_params[:merchant_category_code].to_s.strip,
        enabled_on_invoices: boolean_type.cast(upi_params[:enabled_on_invoices])
      }
    end

    def boolean_type
      @_boolean_type ||= ActiveModel::Type::Boolean.new
    end

    def save_stripe_settings
      PaymentProviders::CreateStripeProviderService.process(current_company)
    end
end
