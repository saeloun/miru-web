# frozen_string_literal: true

class Api::V1::CurrencyPairsController < Api::V1::ApplicationController
  def rate
    authorize current_company, :index?, policy_class: PaymentSettingsPolicy

    from = params[:from].to_s.upcase
    to = params[:to].to_s.upcase

    return render json: { error: I18n.t("currency_pairs.from_to_required") }, status: 400 if from.blank? || to.blank?

    rate = CurrencyPair.get_rate(from, to)

    if rate.present?
      render json: { rate: rate.to_s }, status: 200
    else
      render json: { error: I18n.t("currency_pairs.rate_not_found") }, status: 404
    end
  end
end
