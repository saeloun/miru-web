# frozen_string_literal: true

module Analytics
  class RevenueForecastService < ApplicationService
    SUPPORTED_HORIZONS = [3, 6, 12].freeze
    HISTORICAL_MONTHS = 12
    MOVING_AVERAGE_WINDOW = 3
    PAYMENT_AMOUNT_SQL = Arel.sql("COALESCE(payments.base_currency_amount, payments.amount)").freeze
    INVOICE_AMOUNT_SQL = Arel.sql("COALESCE(invoices.base_currency_amount, invoices.amount)").freeze

    def initialize(company:, horizon: 3, client_ids: nil)
      @company = company
      @horizon = normalize_horizon(horizon)
      @client_ids = Array(client_ids).compact_blank
    end

    def process
      collected_revenue_by_month = normalize_month_keys(monthly_collected_revenue)
      invoiced_revenue_by_month = normalize_month_keys(monthly_invoiced_revenue)
      historical_periods = build_historical_periods(collected_revenue_by_month, invoiced_revenue_by_month)

      {
        horizon:,
        moving_average_window: window_size_for(historical_periods.pluck(:collected_revenue)),
        currency: company.base_currency,
        historical_periods:,
        forecast_periods: build_forecast_periods(historical_periods.pluck(:collected_revenue))
      }
    end

    private

      attr_reader :company, :horizon, :client_ids

      def scoped_invoices
        @scoped_invoices ||= begin
          relation = company.invoices.kept
          client_ids.present? ? relation.where(client_id: client_ids) : relation
        end
      end

      def normalize_horizon(value)
        parsed_value = value.to_i
        SUPPORTED_HORIZONS.include?(parsed_value) ? parsed_value : SUPPORTED_HORIZONS.first
      end

      def historical_range
        @historical_range ||= 11.months.ago.to_date.beginning_of_month..Date.current.end_of_month
      end

      def historical_months
        @historical_months ||= HISTORICAL_MONTHS.times.map do |index|
          (11 - index).months.ago.to_date.beginning_of_month
        end
      end

      def monthly_collected_revenue
        Payment
          .joins(:invoice)
          .where(invoices: { company_id: company.id, discarded_at: nil, client_id: client_ids.presence || scoped_invoices.select(:client_id) })
          .where.not(payments: { status: [Payment.statuses[:failed], Payment.statuses[:cancelled]] })
          .where(payments: { transaction_date: historical_range })
          .group("DATE_TRUNC('month', payments.transaction_date)")
          .sum(PAYMENT_AMOUNT_SQL)
      end

      def monthly_invoiced_revenue
        scoped_invoices
          .where.not(status: :draft)
          .where(issue_date: historical_range)
          .group("DATE_TRUNC('month', invoices.issue_date)")
          .sum(INVOICE_AMOUNT_SQL)
      end

      def normalize_month_keys(grouped_values)
        grouped_values.transform_keys { |value| value.to_date.beginning_of_month }
      end

      def build_historical_periods(collected_revenue_by_month, invoiced_revenue_by_month)
        historical_months.map do |month|
          {
            month: month.iso8601,
            label: month.strftime("%b %Y"),
            collected_revenue: collected_revenue_by_month.fetch(month, 0).to_f.round(2),
            invoiced_revenue: invoiced_revenue_by_month.fetch(month, 0).to_f.round(2)
          }
        end
      end

      def build_forecast_periods(collected_revenue_history)
        forecast_series = collected_revenue_history.dup

        horizon.times.map do |index|
          forecast_month = historical_months.last.advance(months: index + 1)
          forecast_revenue = moving_average(forecast_series)
          forecast_series << forecast_revenue

          {
            month: forecast_month.iso8601,
            label: forecast_month.strftime("%b %Y"),
            forecast_revenue: forecast_revenue.round(2)
          }
        end
      end

      def moving_average(series)
        window = series.last(window_size_for(series))
        return 0.0 if window.empty?

        window.sum.to_f / window.size
      end

      def window_size_for(series)
        [series.size, MOVING_AVERAGE_WINDOW].min
      end
  end
end
