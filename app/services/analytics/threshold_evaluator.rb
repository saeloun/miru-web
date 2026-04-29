# frozen_string_literal: true

module Analytics
  class ThresholdEvaluator < ApplicationService
    LOW_UTILIZATION_THRESHOLD = 60.0
    REVENUE_DROP_FACTOR = 0.7

    def initialize(company:, from: 29.days.ago.to_date, to: Date.current)
      @company = company
      @from = from.to_date
      @to = to.to_date
    end

    def process
      alerts = []

      alerts << low_utilization_alert if low_utilization?
      alerts << revenue_drop_alert if revenue_drop?
      alerts << expense_anomaly_alert if expense_anomaly?

      alerts.compact
    end

    private

      attr_reader :company, :from, :to

      def low_utilization?
        return false if team_summary[:team_size].to_i.zero?

        team_summary[:utilization_rate].to_f < LOW_UTILIZATION_THRESHOLD
      end

      def revenue_drop?
        previous_revenue = comparison_metrics[:collected_revenue][:previous].to_f
        current_revenue = comparison_metrics[:collected_revenue][:current].to_f
        return false if previous_revenue <= 0

        current_revenue < (previous_revenue * REVENUE_DROP_FACTOR)
      end

      def expense_anomaly?
        expense_trends[:anomalies].present?
      end

      def low_utilization_alert
        {
          type: "low_utilization",
          title: "Low utilization detected",
          message: "Team utilization is below 60% for the selected period.",
          metadata: {
            utilization_rate: team_summary[:utilization_rate],
            team_size: team_summary[:team_size],
            from: from.iso8601,
            to: to.iso8601
          }
        }
      end

      def revenue_drop_alert
        {
          type: "revenue_drop",
          title: "Revenue drop detected",
          message: "Collected revenue decreased significantly compared to the previous period.",
          metadata: {
            current_revenue: comparison_metrics[:collected_revenue][:current],
            previous_revenue: comparison_metrics[:collected_revenue][:previous],
            change_percentage: comparison_metrics[:collected_revenue][:change_percentage],
            from: from.iso8601,
            to: to.iso8601
          }
        }
      end

      def expense_anomaly_alert
        {
          type: "expense_anomaly",
          title: "Expense anomalies detected",
          message: "One or more expense anomalies were detected in the selected period.",
          metadata: {
            anomaly_count: expense_trends[:anomalies].size,
            from: from.iso8601,
            to: to.iso8601
          }
        }
      end

      def team_summary
        @team_summary ||= Analytics::TeamProductivityAnalytics.process(
          company: company,
          from: from,
          to: to
        )[:summary]
      end

      def comparison_metrics
        @comparison_metrics ||= Analytics::ComparativeAnalysisService.process(
          company: company,
          from: from,
          to: to
        )[:metrics]
      end

      def expense_trends
        @expense_trends ||= Analytics::ExpenseTrendAnalyzer.process(
          company: company,
          from: from,
          to: to
        )
      end
  end
end
