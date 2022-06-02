# frozen_string_literal: true

class InternalApi::V1::Wise::RecipientsController < InternalApi::V1::WiseController
  def show
    authorize current_company, policy_class: Wise::RecipientPolicy

    response = wise_recipient.fetch(params[:recipient_id])

    render json: response, status: :ok
  rescue => error
    render json: "Error while fetching the recipient details", status: 500
  end

  def create
    authorize current_company, policy_class: Wise::RecipientPolicy

    payload = recipient_params.to_h
    response = wise_recipient.create(payload)

    render json: response.body, status: response.status
  end

  def update
    authorize current_company, policy_class: Wise::RecipientPolicy

    response = wise_recipient.update(recipient_params)

    render json: response.body, status: :ok
  rescue => error
    render json: "Error while updating the recipient details", status: 500
  end

  private

    def wise_recipient
      @wise_recipient ||= Wise::Recipient.new
    end

    def recipient_params
      params.require(:recipient).permit!
    end
end
