# frozen_string_literal: true

class Api::V1::Wise::CurrenciesController < Api::V1::WiseController
  def index
    authorize current_company, policy_class: Wise::CurrencyPolicy

    response = wise_currency.list

    render json: response.body, status: response.status
  end

  private

    def wise_currency
      @_wise_currency ||= Wise::Currency.new
    end
end
