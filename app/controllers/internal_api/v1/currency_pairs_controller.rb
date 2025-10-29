# frozen_string_literal: true

class InternalApi::V1::CurrencyPairsController < InternalApi::V1::ApplicationController
  after_action :verify_authorized

  def rate
    authorize Invoice
    from_currency = params[:from]
    to_currency = params[:to]

    rate = CurrencyPair.get_rate(from_currency, to_currency)

    if rate
      render json: { rate: }, status: :ok
    else
      render json: { error: "Exchange rate not found for #{from_currency} to #{to_currency}" }, status: :not_found
    end
  end
end
