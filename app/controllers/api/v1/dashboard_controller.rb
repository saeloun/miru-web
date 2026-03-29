# frozen_string_literal: true

class Api::V1::DashboardController < Api::V1::BaseController
  def index
    authorize :dashboard, :index?

    @presenter = DashboardPresenter.new(
      company: current_company,
      current_user: current_user,
      timeframe: params[:timeframe] || "year",
      from_date: parsed_date_param(:from_date),
      to_date: parsed_date_param(:to_date)
    )

    render json: @presenter.data
  end

  private

    def parsed_date_param(key)
      value = params[key]
      return if value.blank?

      Date.iso8601(value.to_s)
    rescue ArgumentError
      nil
    end
end
