# frozen_string_literal: true

module MetricsTracking
  extend ActiveSupport::Concern

  included do
    has_many :metrics, as: :trackable, dependent: :destroy
  end

  # Get or calculate a metric for this object
  def metric(type, period = :week, date = Date.current)
    Metric.fetch_or_calculate(self, type, period, date)
  end

  # Get aggregated data for a specific metric
  def metric_data(type, period = :week, date = Date.current)
    metric(type, period, date).data
  end

  # Quick access methods for common metrics
  def hours_logged_metric(period = :week)
    metric(:hours_logged, period)
  end

  def revenue_metric(period = :month)
    metric(:client_revenue, period)
  end

  def outstanding_amounts_metric
    metric(:outstanding_amounts, :all_time)
  end

  # Force recalculation of all metrics
  def recalculate_metrics!
    metrics.each(&:calculate!)
  end

  # Get metrics for a date range
  def metrics_for_range(type, start_date, end_date)
    metrics
      .for_type(type)
      .where(period_date: start_date..end_date)
      .order(:period_date)
  end

  # Optimized methods using cached metrics
  def total_hours_logged_cached(time_frame = "week")
    data = metric_data(:hours_logged, time_frame)
    data["total_minutes"] || 0
  end

  def client_revenue_cached(time_frame = "month")
    data = metric_data(:client_revenue, time_frame)
    {
      total: data["total_revenue"] || 0,
      outstanding: data["total_outstanding"] || 0,
      paid: data["total_paid"] || 0
    }
  end

  def outstanding_summary_cached
    data = metric_data(:outstanding_amounts, :all_time)
    {
      total: data["total_outstanding"] || 0,
      overdue: data["overdue_amount"] || 0,
      by_status: data["by_status"] || {}
    }
  end
end
