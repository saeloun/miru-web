# frozen_string_literal: true

class InternalApi::V1::AnalyticsController < Api::V1::ApplicationController
  SUPPORTED_HORIZONS = [3, 6, 12].freeze

  def revenue_forecast
    authorize :analytics, :revenue_forecast?
    horizon = validated_horizon!
    return if performed?

    render_analytics_payload(:revenue_forecast, horizon:, client_ids: scoped_client_ids)
  end

  def comparison
    authorize :analytics, :comparison?
    date_filters = validated_date_filters!
    return if performed?

    render_analytics_payload(
      :comparison,
      **date_filters,
      user_ids: scoped_team_user_ids,
      client_ids: scoped_client_ids,
      project_ids: scoped_project_ids
    )
  end

  def client_analysis
    authorize :analytics, :client_analysis?
    date_filters = validated_date_filters!
    return if performed?

    render_analytics_payload(:client_analysis, **date_filters, client_ids: scoped_client_ids)
  end

  def team_productivity
    authorize :analytics, :team_productivity?
    date_filters = validated_date_filters!
    return if performed?

    render_analytics_payload(:team_productivity, **date_filters, user_ids: scoped_team_user_ids)
  end

  def expense_trends
    authorize :analytics, :expense_trends?
    date_filters = validated_date_filters!
    return if performed?

    render_analytics_payload(:expense_trends, **date_filters, project_ids: scoped_project_ids)
  end

  private

    def analytics_scope
      @analytics_scope ||= Analytics::ScopeResolver.process(user: current_user, company: current_company)
    end

    def render_analytics_payload(report_type, **filters)
      track_analytics_view(report_type)
      payload = Analytics::QueryService.process(report_type:, company: current_company, filters:)
      render json: payload.merge("meta" => financial_api_meta(currency: current_company.base_currency))
    end

    def track_analytics_view(default_report_type)
      return if ActiveModel::Type::Boolean.new.cast(params[:track_view]) == false

      Analytics::TrackingService.new(user: current_user).track_analytics_page_view(
        page_type: params[:view_context].presence || default_report_type,
        report_type: default_report_type,
        company_id: current_company.id
      )
    end

    def validated_horizon!
      horizon = params[:horizon].presence&.to_i || 3
      return horizon if SUPPORTED_HORIZONS.include?(horizon)

      render_validation_error("horizon must be one of #{SUPPORTED_HORIZONS.join(', ')}")
      nil
    end

    def validated_date_filters!
      parsed_from = parse_date(params[:from])
      parsed_to = parse_date(params[:to])

      if params[:from].present? && parsed_from.nil?
        render_validation_error("from must be a valid date")
        return
      end

      if params[:to].present? && parsed_to.nil?
        render_validation_error("to must be a valid date")
        return
      end

      from = parsed_from || default_from
      to = parsed_to || default_to

      if from > to
        render_validation_error("from must be before or equal to to")
        return
      end

      { from:, to: }
    end

    def normalized_ids(raw_value)
      values = case raw_value
               when String
                 raw_value.split(",")
               else
                 Array(raw_value)
      end

      values.map(&:to_s).map(&:strip).reject(&:blank?).map(&:to_i).uniq
    end

    def scoped_team_user_ids
      return [current_user.id] if analytics_scope[:role] == "employee"
      return intersect_scope_ids(normalized_ids(params[:user_ids]), analytics_scope[:user_ids]) if analytics_scope[:role] == "manager"

      normalized_ids(params[:user_ids])
    end

    def scoped_client_ids
      return intersect_scope_ids(normalized_ids(params[:client_ids]), analytics_scope[:client_ids]) if analytics_scope[:role] == "manager"

      normalized_ids(params[:client_ids])
    end

    def scoped_project_ids
      return intersect_scope_ids(normalized_ids(params[:project_ids]), analytics_scope[:project_ids]) if analytics_scope[:role] == "manager"

      normalized_ids(params[:project_ids])
    end

    def intersect_scope_ids(requested_ids, allowed_ids)
      return allowed_ids if requested_ids.blank?

      requested_ids & allowed_ids
    end

    def parse_date(value)
      return if value.blank?

      Date.iso8601(value)
    rescue ArgumentError
      nil
    end

    def default_from
      29.days.ago.to_date
    end

    def default_to
      Date.current
    end

    def render_validation_error(message)
      render json: { error: message }, status: :unprocessable_entity
    end
end
