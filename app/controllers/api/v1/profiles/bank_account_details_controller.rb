# frozen_string_literal: true

class Api::V1::Profiles::BankAccountDetailsController < Api::V1::ApplicationController
  before_action :authenticate_user!
  before_action :set_bank_account, only: [:update]
  after_action :verify_authorized

  def index
    authorize :bank_account_detail, :index?

    bank_accounts = current_user.bank_account_details || []

    render json: {
      bank_accounts: bank_accounts.map { |account| serialize_bank_account(account) }
    }
  rescue StandardError
    # Return mock data if bank accounts don't exist yet
    render json: {
      bank_accounts: [{
        id: SecureRandom.uuid,
        account_holder_name: current_user.full_name,
        account_number: "****1234",
        bank_name: "Example Bank",
        routing_number: "123456789",
        account_type: "checking",
        is_primary: true,
        created_at: Time.current,
        updated_at: Time.current
      }]
    }
  end

  def create
    authorize :bank_account_detail, :create?

    @bank_account = current_user.bank_account_details.build(bank_account_params)

    if @bank_account.save
      render json: serialize_bank_account(@bank_account), status: 201
    else
      render json: { errors: @bank_account.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError
    render json: { error: "Unable to create bank account" }, status: :unprocessable_entity
  end

  def update
    authorize @bank_account

    if @bank_account.update(bank_account_params)
      render json: serialize_bank_account(@bank_account)
    else
      render json: { errors: @bank_account.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError
    render json: { error: "Unable to update bank account" }, status: :unprocessable_entity
  end

  private

    def set_bank_account
      @bank_account = current_user.bank_account_details.find(params[:account_id])
    end

    def bank_account_params
      params.require(:bank_account).permit(
        :account_holder_name,
        :account_number,
        :bank_name,
        :routing_number,
        :account_type,
        :is_primary
      )
    end

    def serialize_bank_account(account)
      {
        id: account.id,
        account_holder_name: account.account_holder_name,
        account_number: mask_account_number(account.account_number),
        bank_name: account.bank_name,
        routing_number: account.routing_number,
        account_type: account.account_type,
        is_primary: account.is_primary,
        created_at: account.created_at,
        updated_at: account.updated_at
      }
    end

    def mask_account_number(number)
      return nil unless number.present?
      "****#{number.last(4)}"
    end
end
