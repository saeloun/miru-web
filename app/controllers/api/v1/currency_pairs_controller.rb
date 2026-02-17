# frozen_string_literal: true

class Api::V1::CurrencyPairsController < Api::V1::ApplicationController
  def rate
    authorize :wise, :fetch_bank_requirements?

    from = params[:from].to_s.upcase
    to = params[:to].to_s.upcase

    return render json: { error: "from and to are required" }, status: 400 if from.blank? || to.blank?

    rate = CurrencyPair.get_rate(from, to)

    if rate.present?
      render json: { rate: rate.to_s }, status: 200
    else
      render json: { error: "Rate not found" }, status: 404
    end
  end
end
