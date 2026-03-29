# frozen_string_literal: true

module Metrics
  class DataBuilder
    def initialize(metric)
      @metric = metric
      @trackable = metric.trackable
      @metric_type = metric.metric_type
      @period = metric.period
      @period_date = metric.period_date
    end

    def self.build(metric)
      new(metric).build
    end

    def build
      case metric_type
      when "hours_logged"
        hours_logged
      when "invoice_summary"
        invoice_summary
      when "project_stats"
        project_stats
      when "client_revenue"
        client_revenue
      when "outstanding_amounts"
        outstanding_amounts
      else
        {}
      end
    end

    private

      attr_reader :metric, :trackable, :metric_type, :period, :period_date

      def hours_logged
        return {} unless trackable.respond_to?(:timesheet_entries)

        entries = apply_period_filter(trackable.timesheet_entries.kept, :work_date)
        total_minutes = entries.sum(:duration).to_f

        {
          total_minutes: total_minutes,
          total_hours: (total_minutes / 60.0).round(2),
          entry_count: entries.count,
          unique_users: entries.distinct.count(:user_id),
          unique_projects: entries.distinct.count(:project_id),
          by_project: entries.group(:project_id).sum(:duration),
          by_user: entries.group(:user_id).sum(:duration),
          by_date: entries.group(:work_date).sum(:duration)
        }
      end

      def invoice_summary
        return {} unless trackable.respond_to?(:invoices)

        invoices = apply_period_filter(trackable.invoices.kept, :issue_date)

        {
          total_amount: invoices.sum(:amount),
          total_outstanding: invoices.sum(:outstanding_amount),
          total_paid: invoices.sum(:amount_paid),
          count: invoices.count,
          by_status: invoices.group(:status).count,
          amount_by_status: invoices.group(:status).sum(:amount),
          outstanding_by_status: invoices.group(:status).sum(:outstanding_amount),
          average_amount: invoices.average(:amount)&.to_f,
          overdue_count: invoices.overdue.count,
          overdue_amount: invoices.overdue.sum(:outstanding_amount)
        }
      end

      def project_stats
        return {} unless trackable.is_a?(Project)

        entries = apply_period_filter(trackable.timesheet_entries.kept, :work_date)
        invoices = apply_period_filter(trackable.invoices.kept, :issue_date)

        {
          total_hours: (entries.sum(:duration) / 60.0).round(2),
          total_entries: entries.count,
          unique_team_members: entries.distinct.count(:user_id),
          billable_hours: entries.where(bill_status: :billable).sum(:duration) / 60.0,
          non_billable_hours: entries.where(bill_status: :non_billable).sum(:duration) / 60.0,
          revenue: invoices.sum(:amount),
          outstanding: invoices.sum(:outstanding_amount),
          team_members: trackable.project_members.count,
          utilization_rate: utilization_rate(entries)
        }
      end

      def client_revenue
        return {} unless trackable.is_a?(Client)

        invoices = apply_period_filter(trackable.invoices.kept, :issue_date)
        status_amounts = invoices.group(:status).sum(:amount)

        {
          total_revenue: invoices.sum(:amount).to_f,
          total_outstanding: invoices.where(status: ["sent", "viewed", "overdue"]).sum(:amount).to_f,
          total_paid: invoices.where(status: "paid").sum(:amount).to_f,
          invoice_count: invoices.count,
          by_status: status_amounts.transform_values(&:to_f),
          average_invoice_amount: invoices.average(:amount)&.to_f,
          payment_rate: payment_rate(invoices)
        }
      end

      def outstanding_amounts
        return {} unless trackable.respond_to?(:invoices)

        invoices = trackable.invoices.kept

        {
          total_outstanding: invoices.sum(:outstanding_amount),
          by_status: {
            sent: invoices.sent.sum(:outstanding_amount),
            viewed: invoices.viewed.sum(:outstanding_amount),
            overdue: invoices.overdue.sum(:outstanding_amount)
          },
          overdue_count: invoices.overdue.count,
          overdue_amount: invoices.overdue.sum(:outstanding_amount),
          aging: aging(invoices)
        }
      end

      def apply_period_filter(relation, date_column)
        date_range = Metrics::Periods.date_range(period, period_date)
        return relation unless date_range

        relation.where(date_column => date_range)
      end

      def utilization_rate(entries)
        return 0 if entries.empty?

        total_hours = entries.sum(:duration) / 60.0
        billable_hours = entries.where(bill_status: :billable).sum(:duration) / 60.0

        return 0 if total_hours == 0

        ((billable_hours / total_hours) * 100).round(2)
      end

      def payment_rate(invoices)
        return 0 if invoices.empty?

        total = invoices.sum(:amount)
        paid = invoices.paid.sum(:amount)

        return 0 if total == 0

        ((paid / total) * 100).round(2)
      end

      def aging(invoices)
        today = Date.current

        {
          current: invoices.where("due_date >= ?", today).sum(:outstanding_amount),
          "1_30_days": invoices.where("due_date < ? AND due_date >= ?", today, today - 30.days).sum(:outstanding_amount),
          "31_60_days": invoices.where("due_date < ? AND due_date >= ?", today - 30.days, today - 60.days).sum(:outstanding_amount),
          "61_90_days": invoices.where("due_date < ? AND due_date >= ?", today - 60.days, today - 90.days).sum(:outstanding_amount),
          "over_90_days": invoices.where("due_date < ?", today - 90.days).sum(:outstanding_amount)
        }
      end
  end
end
