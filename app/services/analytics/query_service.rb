# frozen_string_literal: true

module Analytics
  class QueryService < ApplicationService
    DEFAULT_EXPIRY = 30.minutes

    def initialize(report_type:, company:, filters: {}, expires_in: DEFAULT_EXPIRY)
      @report_type = report_type.to_s
      @company = company
      @filters = filters.deep_symbolize_keys
      @expires_in = expires_in
    end

    def process
      Analytics::CacheStore.fetch(cache_key, expires_in:) do
        build_payload.deep_stringify_keys
      end
    end

    def refresh!
      Analytics::CacheStore.write(cache_key, build_payload, expires_in:)
    end

    def cache_key
      Analytics::CacheStore.cache_key(namespace: report_type, company_id: company.id, filters:)
    end

    private

      attr_reader :report_type, :company, :filters, :expires_in

      def build_payload
        case report_type
        when "revenue_forecast"
          Analytics::RevenueForecastService.process(company:, horizon: filters.fetch(:horizon, 3), client_ids: filters[:client_ids])
        when "comparison"
          Analytics::ComparativeAnalysisService.process(company:, from: filters.fetch(:from), to: filters.fetch(:to), user_ids: filters[:user_ids], client_ids: filters[:client_ids], project_ids: filters[:project_ids])
        when "client_analysis"
          Analytics::ClientRevenueAnalytics.process(company:, from: filters.fetch(:from), to: filters.fetch(:to), client_ids: filters[:client_ids])
        when "team_productivity"
          Analytics::TeamProductivityAnalytics.process(company:, from: filters.fetch(:from), to: filters.fetch(:to), user_ids: filters[:user_ids])
        when "expense_trends"
          Analytics::ExpenseTrendAnalyzer.process(company:, from: filters.fetch(:from), to: filters.fetch(:to), project_ids: filters[:project_ids])
        else
          raise ArgumentError, "Unsupported analytics report type: #{report_type}"
        end
      end
  end
end
