# frozen_string_literal: true

class InternalApi::V1::WiseController < InternalApi::V1::ApplicationController
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
      @wise ||= Wise::Api.new
    end

    def bank_requirement_params
      params.permit(:source_currency, :target_currency, :source_amount)
    end

    def account_validation_params
      params.permit(:pathname, :search)
    end
end
