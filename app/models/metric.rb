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
        period_date: Metrics::Periods.period_date_for(period, date)
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
  end

  # Instance methods
  def stale?
    return true if new_record?
    return true if calculated_at.nil?

    calculated_at < Metrics::Periods.staleness_threshold(period).ago
  end

  def calculate!
    self.data = Metrics::DataBuilder.build(self)
    self.calculated_at = Time.current

    summary = Metrics::ValueSummary.build(metric_type, data)
    self.value_sum = summary[:value_sum]
    self.value_count = summary[:value_count]
    self.value_avg = summary[:value_avg]

    save!
  end
end
