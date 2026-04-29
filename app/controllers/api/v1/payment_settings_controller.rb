# frozen_string_literal: true

class Api::V1::PaymentSettingsController < Api::V1::ApplicationController
  after_action :save_stripe_settings, only: :index

  def index
    authorize :index, policy_class: PaymentSettingsPolicy

    render :index, locals: { stripe_connected_account:, upi_provider:, razorpay_provider: }
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
      render :index, locals: { stripe_connected_account:, upi_provider:, razorpay_provider: }
    else
      render json: { errors: upi_provider.errors.to_hash(true) }, status: 422
    end
  end

  def update_razorpay
    authorize :update_razorpay, policy_class: PaymentSettingsPolicy

    razorpay_provider.assign_attributes(razorpay_provider_attributes)
    assign_razorpay_secrets_if_present

    if razorpay_provider.save
      render :index, locals: { stripe_connected_account:, upi_provider:, razorpay_provider: }
    else
      render json: { errors: razorpay_provider.errors.to_hash(true) }, status: 422
    end
  end

  private

    def stripe_connected_account
      current_company.stripe_connected_account
    end

    def upi_provider
      @_upi_provider ||= current_company.payments_providers.find_or_initialize_by(name: PaymentsProvider::UPI_PROVIDER)
    end

    def razorpay_provider
      @_razorpay_provider ||= current_company.payments_providers.find_or_initialize_by(name: PaymentsProvider::RAZORPAY_PROVIDER)
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

    def razorpay_params
      params.require(:provider).permit(
        :enabled,
        :enabled_on_invoices,
        :key_id,
        :key_secret,
        :webhook_secret,
        :linked_account_id,
        :platform_fee_percent,
        :route_transfers_enabled,
        :payouts_enabled,
        :payout_account_number,
        :payout_upi_id,
        :payout_purpose,
        :payout_queue_if_low_balance
      )
    end

    def razorpay_provider_attributes
      key_id = razorpay_params[:key_id].to_s.strip
      secret = razorpay_params[:key_secret].to_s.strip

      attrs = {
        connected: key_id.present? && (secret.present? || razorpay_provider.key_secret.present?),
        enabled: boolean_type.cast(razorpay_params[:enabled]),
        accepted_payment_methods: ["razorpay"],
        enabled_on_invoices: boolean_type.cast(razorpay_params[:enabled_on_invoices]),
        key_id:,
        linked_account_id: razorpay_params[:linked_account_id].to_s.strip,
        platform_fee_percent: razorpay_params[:platform_fee_percent].to_s.strip,
        route_transfers_enabled: boolean_type.cast(razorpay_params[:route_transfers_enabled]),
        payouts_enabled: boolean_type.cast(razorpay_params[:payouts_enabled]),
        payout_account_number: razorpay_params[:payout_account_number].to_s.strip,
        payout_upi_id: razorpay_params[:payout_upi_id].to_s.strip,
        payout_purpose: razorpay_params[:payout_purpose].to_s.strip,
        payout_queue_if_low_balance: boolean_type.cast(razorpay_params[:payout_queue_if_low_balance])
      }

      attrs
    end

    # Secret fields are write-only: an empty string keeps the existing encrypted value.
    def assign_razorpay_secrets_if_present
      key_secret = razorpay_params[:key_secret].to_s.strip
      webhook_secret = razorpay_params[:webhook_secret].to_s.strip

      razorpay_provider.key_secret = key_secret if key_secret.present?
      razorpay_provider.webhook_secret = webhook_secret if webhook_secret.present?
    end

    def boolean_type
      @_boolean_type ||= ActiveModel::Type::Boolean.new
    end

    def save_stripe_settings
      PaymentProviders::CreateStripeProviderService.process(current_company)
    end
end
