# frozen_string_literal: true

module Analytics
  class ExpenseTrendAnalyzer < ApplicationService
    ANOMALY_MULTIPLIER = 1.5

    def initialize(company:, from:, to:, project_ids: nil)
      @company = company
      @from = from.to_date
      @to = to.to_date
      @project_ids = Array(project_ids).compact_blank
    end

    def process
      {
        period: { from: from.iso8601, to: to.iso8601 },
        summary:,
        category_trends:,
        project_trends:,
        anomalies:
      }
    end

    private

      attr_reader :company, :from, :to, :project_ids

      def scoped_expenses
        @scoped_expenses ||= begin
          relation = company.expenses.kept.where(date: from..to)
          project_ids.present? ? relation.where(project_id: project_ids) : relation
        end
      end

      def summary
        {
          total_expenses: scoped_expenses.sum(:amount).to_f.round(2),
          expense_count: scoped_expenses.count,
          category_count: category_trends.size,
          project_count: project_trends.size,
          anomaly_count: anomalies.size
        }
      end

      def category_trends
        @category_trends ||= build_dimension_trends(label_sql: "COALESCE(expenses.category_name, expense_categories.name, 'Uncategorized')", join_categories: true)
      end

      def project_trends
        @project_trends ||= build_dimension_trends(label_sql: "COALESCE(projects.name, 'Unassigned')", join_projects: true)
      end

      def anomalies
        @anomalies ||= monthly_expenses_by_category.flat_map do |category_name, monthly_totals|
          positive_months = monthly_totals.values.count(&:positive?)
          next [] if positive_months < 3

          monthly_totals.filter_map do |month, amount|
            next unless amount.positive?

            comparison_values = monthly_totals.except(month).values.select(&:positive?)
            next if comparison_values.size < 2

            rolling_average = average(comparison_values)
            threshold = (rolling_average * ANOMALY_MULTIPLIER).round(2)
            next unless amount > threshold

            {
              dimension: "category",
              name: category_name,
              month: month.iso8601,
              amount: amount.round(2),
              rolling_average: rolling_average.round(2),
              threshold:
            }
          end
        end
      end

      def build_dimension_trends(label_sql:, join_categories: false, join_projects: false)
        relation = scoped_expenses
        relation = relation.left_joins(:project) if join_projects
        relation = relation.left_joins(:expense_category) if join_categories

        grouped = relation.group(
          Arel.sql(label_sql),
          Arel.sql("DATE_TRUNC('month', expenses.date)")
        ).sum(:amount)

        grouped_by_name = grouped.each_with_object(Hash.new { |hash, key| hash[key] = {} }) do |((name, month), amount), values|
          values[name][month.to_date.beginning_of_month] = amount.to_f
        end

        grouped_by_name.map do |name, month_values|
          total_amount = month_values.values.sum

          {
            name:,
            total_amount: total_amount.round(2),
            monthly_totals: months_in_range.map do |month|
              {
                month: month.iso8601,
                label: month.strftime("%b %Y"),
                amount: month_values.fetch(month, 0.0).round(2)
              }
            end
          }
        end.sort_by { |trend| -trend[:total_amount] }
      end

      def monthly_expenses_by_category
        @monthly_expenses_by_category ||= category_trends.each_with_object({}) do |trend, values|
          values[trend[:name]] = trend[:monthly_totals].each_with_object({}) do |month_total, months|
            months[Date.iso8601(month_total[:month])] = month_total[:amount]
          end
        end
      end

      def months_in_range
        @months_in_range ||= begin
          cursor = from.beginning_of_month
          last_month = to.beginning_of_month
          months = []

          while cursor <= last_month
            months << cursor
            cursor = cursor.next_month
          end

          months
        end
      end

      def average(values)
        return 0.0 if values.empty?

        values.sum.to_f / values.size
      end
  end
end
