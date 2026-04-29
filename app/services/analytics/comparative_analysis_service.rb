# frozen_string_literal: true

module Analytics
  class ComparativeAnalysisService < ApplicationService
    # :reek:LongParameterList
    def initialize(company:, from:, to:, user_ids: nil, client_ids: nil, project_ids: nil)
      @company = company
      @from = from.to_date
      @to = to.to_date
      @user_ids = Array(user_ids).compact_blank
      @client_ids = Array(client_ids).compact_blank
      @project_ids = Array(project_ids).compact_blank
    end

    def process
      {
        current_period: { from: from.iso8601, to: to.iso8601 },
        previous_period: { from: previous_from.iso8601, to: previous_to.iso8601 },
        metrics: build_metrics
      }
    end

    private

      attr_reader :company, :from, :to, :user_ids, :client_ids, :project_ids

      def build_metrics
        {
          collected_revenue: compare_metric(current_collected_revenue, previous_collected_revenue),
          invoiced_revenue: compare_metric(current_invoiced_revenue, previous_invoiced_revenue),
          total_expenses: compare_metric(current_expenses, previous_expenses),
          billable_hours: compare_metric(current_team_summary[:billable_hours], previous_team_summary[:billable_hours]),
          utilization_rate: compare_metric(current_team_summary[:utilization_rate], previous_team_summary[:utilization_rate]),
          average_hourly_rate: compare_metric(current_team_summary[:average_hourly_rate], previous_team_summary[:average_hourly_rate])
        }
      end

      def current_team_summary
        @current_team_summary ||= Analytics::TeamProductivityAnalytics.process(
          company:,
          from:,
          to:,
          user_ids:
        )[:summary]
      end

      def previous_team_summary
        @previous_team_summary ||= Analytics::TeamProductivityAnalytics.process(
          company:,
          from: previous_from,
          to: previous_to,
          user_ids:
        )[:summary]
      end

      def current_collected_revenue
        collected_revenue_for(from..to)
      end

      def previous_collected_revenue
        collected_revenue_for(previous_from..previous_to)
      end

      def current_invoiced_revenue
        invoiced_revenue_for(from..to)
      end

      def previous_invoiced_revenue
        invoiced_revenue_for(previous_from..previous_to)
      end

      def current_expenses
        expenses_for(from..to)
      end

      def previous_expenses
        expenses_for(previous_from..previous_to)
      end

      def collected_revenue_for(range)
        Payment.joins(:invoice)
          .where(invoices: { company_id: company.id, discarded_at: nil })
          .yield_self { |scope| client_ids.present? ? scope.where(invoices: { client_id: client_ids }) : scope }
          .where(payments: { transaction_date: range })
          .where.not(payments: { status: [Payment.statuses[:failed], Payment.statuses[:cancelled]] })
          .sum(Arel.sql("COALESCE(payments.base_currency_amount, payments.amount)"))
          .to_f
          .round(2)
      end

      def invoiced_revenue_for(range)
        company.invoices.kept
          .yield_self { |scope| client_ids.present? ? scope.where(client_id: client_ids) : scope }
          .where(issue_date: range)
          .where.not(status: :draft)
          .sum(Arel.sql("COALESCE(base_currency_amount, amount)"))
          .to_f
          .round(2)
      end

      def expenses_for(range)
        company.expenses.kept.where(date: range)
          .yield_self { |scope| project_ids.present? ? scope.where(project_id: project_ids) : scope }
          .sum(:amount).to_f.round(2)
      end

      def compare_metric(current_value, previous_value)
        {
          current: current_value.to_f.round(2),
          previous: previous_value.to_f.round(2),
          change: (current_value.to_f - previous_value.to_f).round(2),
          change_percentage: percentage_change(current_value, previous_value)
        }
      end

      def percentage_change(current_value, previous_value)
        return 0.0 if previous_value.to_f.zero?

        (((current_value.to_f - previous_value.to_f) / previous_value.to_f) * 100).round(2)
      end

      def previous_from
        @previous_from ||= from - period_length_days
      end

      def previous_to
        @previous_to ||= from - 1.day
      end

      def period_length_days
        @period_length_days ||= (to - from).to_i + 1
      end
  end
end
