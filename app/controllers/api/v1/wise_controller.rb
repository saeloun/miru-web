# frozen_string_literal: true

class Api::V1::WiseController < Api::V1::ApplicationController
  skip_before_action :authenticate_user_using_x_auth_token

  def fetch_bank_requirements
    authorize current_company, policy_class: WisePolicy

    response = wise.fetch_bank_requirements(*bank_requirement_params.to_h.values)

    render json: response.body, status: response.status
  end

  def validate_account_details
    authorize current_company, policy_class: WisePolicy

    response = wise.validate_account_details(*account_validation_params.to_h.values)

    render json: response.body, status: response.status
  end

  private

    def wise
      @_wise ||= Wise::Api.new
    end

    def bank_requirement_params
      params.permit(:source_currency, :target_currency, :source_amount)
    end

    def account_validation_params
      params.permit(:pathname, :search)
    end
end
