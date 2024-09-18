# frozen_string_literal: true

class InternalApi::V1::PaymentSettingsController < InternalApi::V1::ApplicationController
  after_action :save_stripe_settings, only: :index

  def index
    authorize :index, policy_class: PaymentSettingsPolicy

    render :index, locals: { stripe_connected_account:, bank_account: current_company.bank_account }
  end

  def connect_stripe
    authorize :connect_stripe, policy_class: PaymentSettingsPolicy

    StripeConnectedAccount.create!({ company: current_company }) if stripe_connected_account.nil?

    render :connect_stripe, locals: { stripe_connected_account: }
  end

  def destroy
    authorize :destroy, policy_class: PaymentSettingsPolicy

    if stripe_connected_account.destroy
      render json: { notice: "Stripe connection disconnected" }, status: :ok
    else
      render json: { error: "Unable to process the request" }, status: :unprocessable_entity
    end
  end

  def update_bank_account
    authorize :update_bank_account, policy_class: PaymentSettingsPolicy

    @bank_account = current_company.bank_account || current_company.build_bank_account
    if @bank_account.update(bank_account_params)
      render json: { notice: "Bank account details updated successfully" }, status: :ok
    else
      render json: { error: @bank_account.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

    def stripe_connected_account
      current_company.stripe_connected_account
    end

    def save_stripe_settings
      PaymentProviders::CreateStripeProviderService.process(current_company)
    end

    def bank_account_params
      params.require(:bank_account).permit(:routing_number, :account_number, :account_type, :bank_name)
    end
end
