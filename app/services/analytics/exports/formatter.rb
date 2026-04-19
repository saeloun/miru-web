# frozen_string_literal: true

module Analytics
  module Exports
    class Formatter
      def initialize(report_type:, payload:, company:, filters: {})
        @report_type = report_type.to_s
        @payload = payload.deep_symbolize_keys
        @company = company
        @filters = filters.deep_symbolize_keys
      end

      def export_payload
        case report_type
        when "revenue_forecast"
          revenue_forecast_payload
        when "team_productivity"
          team_productivity_payload
        when "client_analysis"
          client_analysis_payload
        when "expense_trends"
          expense_trends_payload
        else
          raise ArgumentError, "Unsupported analytics export type: #{report_type}"
        end
      end

      private

        attr_reader :report_type, :payload, :company, :filters

        def revenue_forecast_payload
          historical_periods = payload.fetch(:historical_periods, [])
          forecast_periods = payload.fetch(:forecast_periods, [])
          total_collected = historical_periods.sum { |period| period[:collected_revenue].to_f }
          recent = historical_periods.last(3)
          average_recent = recent.any? ? (recent.sum { |period| period[:collected_revenue].to_f } / recent.size) : 0
          projected_total = forecast_periods.sum { |period| period[:forecast_revenue].to_f }

          {
            title: "Revenue Forecast",
            filters: export_filters,
            summary_rows: [
              ["Currency", payload[:currency] || company.base_currency],
              ["Forecast horizon", "#{payload[:horizon]} months"],
              ["Collected revenue", format_amount(total_collected)],
              ["Average recent month", format_amount(average_recent)],
              ["Projected revenue", format_amount(projected_total)]
            ],
            tables: [
              {
                title: "Forecast data",
                headers: ["Month", "Collected revenue", "Invoiced revenue", "Forecast revenue"],
                rows: build_revenue_rows(historical_periods, forecast_periods)
              }
            ]
          }
        end

        def team_productivity_payload
          summary = payload.fetch(:summary, {})

          {
            title: "Team Analytics",
            filters: export_filters,
            summary_rows: [
              ["Team size", summary[:team_size]],
              ["Total hours", summary[:total_hours]],
              ["Billable hours", summary[:billable_hours]],
              ["Utilization rate", percentage(summary[:utilization_rate])],
              ["Average hourly rate", format_amount(summary[:average_hourly_rate])]
            ],
            tables: [
              {
                title: "Team members",
                headers: ["Member", "Total hours", "Billable hours", "Non-billable hours", "Utilization rate", "Average hourly rate"],
                rows: payload.fetch(:members, []).map do |member|
                  [
                    member[:user_name],
                    member[:total_hours],
                    member[:billable_hours],
                    member[:non_billable_hours],
                    percentage(member[:utilization_rate]),
                    format_amount(member[:average_hourly_rate])
                  ]
                end
              }
            ]
          }
        end

        def client_analysis_payload
          summary = payload.fetch(:summary, {})

          {
            title: "Client Insights",
            filters: export_filters,
            summary_rows: [
              ["Client count", summary[:client_count]],
              ["Total revenue", format_amount(summary[:total_revenue])],
              ["Collected revenue", format_amount(summary[:total_collected_revenue])],
              ["Average invoice amount", format_amount(summary[:average_invoice_amount])],
              ["Average payment frequency", "#{summary[:average_payment_frequency_days]} days"],
              ["Average payment cycle", "#{summary[:average_payment_cycle_days]} days"]
            ],
            tables: [
              {
                title: "Clients",
                headers: ["Client", "Revenue", "Collected", "Invoices", "Payments", "Average invoice amount", "Payment frequency", "Payment cycle", "Trend"],
                rows: payload.fetch(:clients, []).map do |client|
                  [
                    client[:client_name],
                    format_amount(client[:total_revenue]),
                    format_amount(client[:collected_revenue]),
                    client[:invoice_count],
                    client[:payment_count],
                    format_amount(client[:average_invoice_amount]),
                    "#{client[:payment_frequency_days]} days",
                    "#{client[:payment_cycle_days]} days",
                    client[:trend_direction].to_s.titleize
                  ]
                end
              }
            ]
          }
        end

        def expense_trends_payload
          summary = payload.fetch(:summary, {})

          {
            title: "Expense Trends",
            filters: export_filters,
            summary_rows: [
              ["Total expenses", format_amount(summary[:total_expenses])],
              ["Expense count", summary[:expense_count]],
              ["Category count", summary[:category_count]],
              ["Project count", summary[:project_count]],
              ["Anomaly count", summary[:anomaly_count]]
            ],
            tables: [
              build_expense_trend_table("Category trends", payload.fetch(:category_trends, [])),
              build_expense_trend_table("Project trends", payload.fetch(:project_trends, [])),
              {
                title: "Anomalies",
                headers: ["Dimension", "Name", "Month", "Amount", "Rolling average", "Threshold"],
                rows: payload.fetch(:anomalies, []).map do |anomaly|
                  [
                    anomaly[:dimension],
                    anomaly[:name],
                    anomaly[:month],
                    format_amount(anomaly[:amount]),
                    format_amount(anomaly[:rolling_average]),
                    format_amount(anomaly[:threshold])
                  ]
                end
              }
            ]
          }
        end

        def build_revenue_rows(historical_periods, forecast_periods)
          historical_periods.map do |period|
            [
              period[:label],
              format_amount(period[:collected_revenue]),
              format_amount(period[:invoiced_revenue]),
              nil
            ]
          end + forecast_periods.map do |period|
            [period[:label], nil, nil, format_amount(period[:forecast_revenue])]
          end
        end

        def build_expense_trend_table(title, trends)
          headers = ["Name", "Total amount"] + trend_labels(trends)

          {
            title:,
            headers:,
            rows: trends.map do |trend|
              [trend[:name], format_amount(trend[:total_amount])] + trend[:monthly_totals].map { |point| format_amount(point[:amount]) }
            end
          }
        end

        def trend_labels(trends)
          trends.first&.dig(:monthly_totals)&.map { |point| point[:label] } || []
        end

        def export_filters
          rows = []
          rows << ["From", filters[:from]] if filters[:from].present?
          rows << ["To", filters[:to]] if filters[:to].present?
          rows << ["Horizon", "#{filters[:horizon]} months"] if filters[:horizon].present?
          rows
        end

        def format_amount(amount)
          FormatAmountService.new(company.base_currency || "USD", amount.to_f).process
        end

        def percentage(value)
          "#{value.to_f.round(2)}%"
        end
    end
  end
end
