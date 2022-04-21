# frozen_string_literal: true

class InternalApi::V1::Teams::TransferWiseController < InternalApi::V1::ApplicationController
  skip_after_action :verify_authorized, only: :create

  def create
    recipient_service = Recipient::CreateService.new(
      user: current_user,
      recipient_account_params: params_for_create_recipient_account)
    render json: recipient_service.process, status: :created
  end

  private

    def params_for_create_recipient_account
      params.require(:recipient).permit(:currency, :profile, :type, :accountHolderName, :ownedByCustomer, details: {})
    end
end
