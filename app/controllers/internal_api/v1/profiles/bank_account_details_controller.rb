# frozen_string_literal: true

class InternalApi::V1::Profiles::BankAccountDetailsController < InternalApi::V1::ApplicationController
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
  rescue => error
    render json: {
      error: error.message
    }, status: 500
  end

  def update
    authorize :update, policy_class: Profiles::BillingPolicy

    @account.update!(
      recipient_id: params[:id],
      profile_id: params[:profile],
      target_currency: params[:currency],
      source_currency: "USD",
      company_id: current_company.id,
      user_id: current_user.id
    )

    render :index, locals: {
      wise_account: @account
    }
  rescue => error
    render json: {
      error: error.message
    }, status: 500
  end

  private

    def load_wise_account
      @wise_account ||= current_user.wise_account
    end

    def fetch_wise_account
      @account = WiseAccount.find(params[:account_id])
    end
end
