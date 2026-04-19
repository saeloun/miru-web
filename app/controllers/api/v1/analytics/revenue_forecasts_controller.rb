# frozen_string_literal: true

# Compatibility endpoint for existing frontend consumers.
# InternalApi::V1::AnalyticsController#revenue_forecast is the canonical backend interface.
class Api::V1::Analytics::RevenueForecastsController < Api::V1::ApplicationController
  def index
    authorize :analytics, :revenue_forecast?

    horizon = params[:horizon].presence&.to_i || 3
    unless [3, 6, 12].include?(horizon)
      render json: { error: "horizon must be one of 3, 6, 12" }, status: :unprocessable_entity
      return
    end

    scope = Analytics::ScopeResolver.process(user: current_user, company: current_company)

    payload = Analytics::QueryService.process(
      report_type: :revenue_forecast,
      company: current_company,
      filters: {
        horizon:,
        client_ids: scope[:role] == "manager" ? scope[:client_ids] : []
      }
    )

    response.set_header("X-Analytics-Canonical-Endpoint", "/internal_api/v1/analytics/revenue_forecast")
    response.set_header("X-Analytics-Compatibility", "true")

    render json: payload.merge("meta" => financial_api_meta(currency: current_company.base_currency))
  end
end
