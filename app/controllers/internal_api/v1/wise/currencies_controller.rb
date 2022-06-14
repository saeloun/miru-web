# frozen_string_literal: true

class InternalApi::V1::Wise::CurrenciesController < InternalApi::V1::WiseController
  def index
    authorize current_company, policy_class: Wise::CurrencyPolicy

    response = wise_currency.list

    render json: response.body, status: response.status
  end

  private

    def wise_currency
      @wise_currency ||= Wise::Currency.new
    end
end
