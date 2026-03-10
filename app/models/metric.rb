# frozen_string_literal: true

class Metric < ApplicationRecord
  # Associations
  belongs_to :trackable, polymorphic: true

  # Enums
  enum :period, {
    hour: "hour",
    day: "day",
    week: "week",
    month: "month",
    quarter: "quarter",
    year: "year",
    all_time: "all_time"
  }

  enum :metric_type, {
    hours_logged: "hours_logged",
    invoice_summary: "invoice_summary",
    project_stats: "project_stats",
    client_revenue: "client_revenue",
    team_utilization: "team_utilization",
    outstanding_amounts: "outstanding_amounts",
    overdue_amounts: "overdue_amounts",
    timesheet_summary: "timesheet_summary"
  }

  # Validations
  validates :metric_type, :period, :calculated_at, presence: true
  validates :data, presence: true

  # Scopes
  scope :recent, -> { order(calculated_at: :desc) }
  scope :for_period, ->(period) { where(period: period) }
  scope :for_date, ->(date) { where(period_date: date) }
  scope :for_type, ->(type) { where(metric_type: type) }

  # Class methods for caching and retrieving metrics
  class << self
    def fetch_or_calculate(trackable, metric_type, period = :week, date = Date.current)
      metric = find_or_initialize_by(
        trackable: trackable,
        metric_type: metric_type,
        period: period,
        period_date: period_date_for(period, date)
      )

      # Recalculate if stale (older than 1 hour for recent periods)
      if metric.stale?
        metric.calculate!
      end

      metric
    end

    def bulk_calculate(trackables, metric_type, period = :week)
      trackables.each do |trackable|
        MetricCalculationJob.perform_later(trackable, metric_type, period)
      end
    end

    private

      def period_date_for(period, date)
        case period.to_s
        when "day"
          date.to_date
        when "week"
          date.beginning_of_week
        when "month"
          date.beginning_of_month
        when "quarter"
          date.beginning_of_quarter
        when "year"
          date.beginning_of_year
        when "all_time"
          nil
        else
          date.to_date
        end
      end
  end

  # Instance methods
  def stale?
    return true if new_record?
    return true if calculated_at.nil?

    staleness_threshold = case period.to_s
                          when "hour", "day"
                            1.hour
                          when "week"
                            6.hours
                          when "month"
                            1.day
                          when "quarter", "year"
                            1.week
                          when "all_time"
                            1.day
                          else
                            1.hour
    end

    calculated_at < staleness_threshold.ago
  end

  def calculate!
    self.data = calculate_metric_data
    self.calculated_at = Time.current

    # Extract common values for quick access based on metric type
    case metric_type
    when "hours_logged"
      self.value_sum = data["total_minutes"] || 0
      self.value_count = data["entry_count"] || 0
    when "invoice_summary", "client_revenue"
      self.value_sum = data["total_amount"] || data["total_revenue"] || 0
      self.value_count = data["count"] || data["invoice_count"] || 0
    when "outstanding_amounts"
      self.value_sum = data["total_outstanding"] || 0
      self.value_count = data["overdue_count"] || 0
    else
      self.value_sum = data["total_value"] || 0
      self.value_count = data["count"] || 0
    end

    if value_count > 0 && value_sum > 0
      self.value_avg = value_sum / value_count
    end

    save!
  end

  private

    def calculate_metric_data
      case metric_type
      when "hours_logged"
        calculate_hours_logged
      when "invoice_summary"
        calculate_invoice_summary
      when "project_stats"
        calculate_project_stats
      when "client_revenue"
        calculate_client_revenue
      when "outstanding_amounts"
        calculate_outstanding_amounts
      else
        {}
      end
    end

    def calculate_hours_logged
      return {} unless trackable.respond_to?(:timesheet_entries)

      entries = trackable.timesheet_entries.kept
      entries = apply_period_filter(entries, :work_date)

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

    def calculate_invoice_summary
      return {} unless trackable.respond_to?(:invoices)

      invoices = trackable.invoices.kept
      invoices = apply_period_filter(invoices, :issue_date)

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

    def calculate_project_stats
      return {} unless trackable.is_a?(Project)

      entries = trackable.timesheet_entries.kept
      entries = apply_period_filter(entries, :work_date)

      invoices = trackable.invoices.kept
      invoices = apply_period_filter(invoices, :issue_date)

      {
        total_hours: (entries.sum(:duration) / 60.0).round(2),
        total_entries: entries.count,
        unique_team_members: entries.distinct.count(:user_id),
        billable_hours: entries.where(bill_status: :billable).sum(:duration) / 60.0,
        non_billable_hours: entries.where(bill_status: :non_billable).sum(:duration) / 60.0,
        revenue: invoices.sum(:amount),
        outstanding: invoices.sum(:outstanding_amount),
        team_members: trackable.project_members.count,
        utilization_rate: calculate_utilization_rate(entries)
      }
    end

    def calculate_client_revenue
      return {} unless trackable.is_a?(Client)

      invoices = trackable.invoices.kept
      invoices = apply_period_filter(invoices, :issue_date)

      # Group invoices by status for calculation
      status_amounts = invoices.group(:status).sum(:amount)

      {
        total_revenue: invoices.sum(:amount).to_f,
        total_outstanding: invoices.where(status: ["sent", "viewed", "overdue"]).sum(:amount).to_f,
        total_paid: invoices.where(status: "paid").sum(:amount).to_f,
        invoice_count: invoices.count,
        by_status: status_amounts.transform_values(&:to_f),
        average_invoice_amount: invoices.average(:amount)&.to_f,
        payment_rate: calculate_payment_rate(invoices)
      }
    end

    def calculate_outstanding_amounts
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
        aging: calculate_aging(invoices)
      }
    end

    def apply_period_filter(relation, date_column)
      return relation if period == "all_time" || period_date.nil?

      date_range = case period
                   when "day"
                     period_date.beginning_of_day..period_date.end_of_day
                   when "week"
                     period_date.beginning_of_week..period_date.end_of_week
                   when "month"
                     period_date.beginning_of_month..period_date.end_of_month
                   when "quarter"
                     period_date.beginning_of_quarter..period_date.end_of_quarter
                   when "year"
                     period_date.beginning_of_year..period_date.end_of_year
                   else
                     return relation
      end

      relation.where(date_column => date_range)
    end

    def calculate_utilization_rate(entries)
      return 0 if entries.empty?

      total_hours = entries.sum(:duration) / 60.0
      billable_hours = entries.where(bill_status: :billable).sum(:duration) / 60.0

      return 0 if total_hours == 0
      ((billable_hours / total_hours) * 100).round(2)
    end

    def calculate_payment_rate(invoices)
      return 0 if invoices.empty?

      total = invoices.sum(:amount)
      paid = invoices.paid.sum(:amount)

      return 0 if total == 0
      ((paid / total) * 100).round(2)
    end

    def calculate_aging(invoices)
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
