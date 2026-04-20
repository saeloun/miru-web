# frozen_string_literal: true

class InternalApi::V1::AnalyticsExportsController < Api::V1::ApplicationController
  SUPPORTED_REPORT_TYPES = %w[revenue_forecast team_productivity client_analysis expense_trends].freeze
  SUPPORTED_FORMATS = %w[csv pdf].freeze
  SUPPORTED_HORIZONS = [3, 6, 12].freeze

  def show
    authorize :analytics, :index?

    return render_validation_error("Unsupported analytics export") unless SUPPORTED_REPORT_TYPES.include?(params[:report_type])
    return render_validation_error("Unsupported export format") unless SUPPORTED_FORMATS.include?(request.format.symbol.to_s)

    authorize_report_type!
    return if performed?

    export_filters
    return if performed?

    send_data download_service.process,
      type: download_service.content_type,
      disposition: "attachment",
      filename: download_service.filename
  rescue Ferrum::BinaryNotFoundError, Ferrum::ProcessTimeoutError, Ferrum::DeadBrowserError => error
    render_pdf_generation_error(error)
  end

  private

    def analytics_scope
      @analytics_scope ||= Analytics::ScopeResolver.process(user: current_user, company: current_company)
    end

    def download_service
      @download_service ||= Analytics::Exports::DownloadService.new(
        report_type: params[:report_type],
        format: request.format.symbol,
        company: current_company,
        filters: export_filters
      )
    end

    def export_filters
      case params[:report_type]
      when "revenue_forecast"
        { horizon: validated_horizon!, client_ids: scoped_client_ids }
      when "team_productivity"
        date_filters.merge(user_ids: scoped_team_user_ids)
      when "client_analysis"
        date_filters.merge(client_ids: scoped_client_ids)
      when "expense_trends"
        date_filters.merge(project_ids: scoped_project_ids)
      else
        {}
      end
    end

    def authorize_report_type!
      case params[:report_type]
      when "revenue_forecast"
        authorize :analytics, :revenue_forecast?
      when "team_productivity"
        authorize :analytics, :team_productivity?
      when "client_analysis"
        authorize :analytics, :client_analysis?
      when "expense_trends"
        authorize :analytics, :expense_trends?
      end
    end

    def date_filters
      @date_filters ||= begin
        parsed_from = parse_date(params[:from])
        parsed_to = parse_date(params[:to])
        if params[:from].present? && parsed_from.nil?
          render_validation_error("from must be a valid date")
          return {}
        end
        if params[:to].present? && parsed_to.nil?
          render_validation_error("to must be a valid date")
          return {}
        end

        from = parsed_from || 29.days.ago.to_date
        to = parsed_to || Date.current
        if from > to
          render_validation_error("from must be before or equal to to")
          return {}
        end

        { from:, to: }
      end
    end

    def validated_horizon!
      horizon = params[:horizon].presence&.to_i || 3
      return horizon if SUPPORTED_HORIZONS.include?(horizon)

      render_validation_error("horizon must be one of #{SUPPORTED_HORIZONS.join(', ')}")
      3
    end

    def normalized_ids(raw_value)
      values = case raw_value
      when String then raw_value.split(",")
      else Array(raw_value)
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

    def render_validation_error(message)
      render json: { error: message }, status: :unprocessable_entity
    end

    def render_pdf_generation_error(error)
      Rails.logger.warn("Analytics PDF export unavailable: #{error.class}: #{error.message}")

      render json: {
        error: "PDF export is temporarily unavailable because the browser renderer is not configured on this environment. CSV export remains available."
      }, status: :service_unavailable
    end
end
