# frozen_string_literal: true

class InternalApi::V1::WiseController < ApplicationController
  def create_recipient
    payload = recipient_params.to_h
    response = wise.create_recipient(payload)

    render json: response.body, status: response.status
  end

  def fetch_currencies
    response = wise.fetch_currencies

    render json: response.body, status: response.status
  end

  def fetch_bank_requirements
    response = wise.fetch_bank_requirements(*bank_requirement_params.to_h.values)

    render json: response.body, status: response.status
  end

  def validate_account_details
    response = wise.validate_account_details(*account_validation_params.to_h.values)

    render json: response.body, status: response.status
  end

  def fetch_recipient
    response = wise.fetch_recipient(params[:recipient_id])

    render json: response, status: :ok
  rescue => error
    render json: "Error while fetching the recipient details", status: 500
  end

  def update_recipient
    response = wise.update_recipient(recipient_params)

    render json: response.body, status: :ok
  rescue => error
    render json: "Error while updating the recipient details", status: 500
  end

  private

    def wise
      @wise ||= Wise::Api.new
    end

    def bank_requirement_params
      params.permit(:source_currency, :target_currency, :source_amount)
    end

    def account_validation_params
      params.permit(:pathname, :search)
    end

    def recipient_params
      params.require(:wise).permit!
    end
end
