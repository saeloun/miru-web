# frozen_string_literal: true

class Api::V1::Profiles::BankAccountDetailsController < Api::V1::ApplicationController
  before_action :load_wise_account, only: [:index]
  before_action :fetch_wise_account, only: [:update]

  def index
    authorize :index, policy_class: Profiles::BillingPolicy
    render :index, locals: {
      wise_account: @wise_account
    }
  end

  def create
    authorize :create, policy_class: Profiles::BillingPolicy

    @wise_account = WiseAccount.create!(
      recipient_id: params[:id],
      profile_id: params[:profile],
      target_currency: params[:currency],
      source_currency: "USD",
      company_id: current_company.id,
      user_id: current_user.id
    )

    render :index, locals: {
      wise_account: @wise_account
    }
  rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique
    render json: { error: "Unable to save bank account details" }, status: :unprocessable_entity
  rescue StandardError => e
    Rails.logger.error "BankAccountDetails create error: #{e.message}"
    render json: { error: "Unable to save bank account details" }, status: 500
  end

  def update
    authorize @account, :update?, policy_class: Profiles::BillingPolicy

    @account.update!(
      recipient_id: params[:id],
      profile_id: params[:profile],
      target_currency: params[:currency],
      source_currency: "USD",
      user_id: current_user.id
    )

    render :index, locals: {
      wise_account: @account
    }
  rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique
    render json: { error: "Unable to update bank account details" }, status: :unprocessable_entity
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Bank account not found" }, status: 404
  rescue StandardError => e
    Rails.logger.error "BankAccountDetails update error: #{e.message}"
    render json: { error: "Unable to update bank account details" }, status: 500
  end

  private

    def load_wise_account
      @wise_account ||= WiseAccount.find_by(user_id: current_user.id, company_id: current_company.id)
    end

    def fetch_wise_account
      @account = WiseAccount.find_by!(id: params[:account_id], user_id: current_user.id, company_id: current_company.id)
    end
end
