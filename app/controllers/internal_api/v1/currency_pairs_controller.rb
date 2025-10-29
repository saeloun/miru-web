# frozen_string_literal: true

class InternalApi::V1::CurrencyPairsController < InternalApi::V1::ApplicationController
  after_action :verify_authorized

  def rate
    authorize Invoice

    # Validate that both from and to parameters are present and not blank
    if params[:from].blank? || params[:to].blank?
      return render json: { error: "Missing from/to currency" }, status: :bad_request
    end

    # Normalize inputs to uppercase
    from_currency = params[:from].to_s.strip.upcase
    to_currency = params[:to].to_s.strip.upcase

    rate = CurrencyPair.get_rate(from_currency, to_currency)

    if rate
      render json: { rate: }, status: :ok
    else
      render json: { error: "Exchange rate not found for #{from_currency} to #{to_currency}" }, status: :not_found
    end
  end
end
