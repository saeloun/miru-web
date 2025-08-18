# frozen_string_literal: true

class Api::V1::DashboardController < Api::V1::BaseController
  def index
    authorize :dashboard, :index?

    @presenter = DashboardPresenter.new(
      company: current_company,
      timeframe: params[:timeframe] || "month",
      from_date: params[:from_date],
      to_date: params[:to_date]
    )

    render json: @presenter.data
  end
end
