# frozen_string_literal: true

# == Schema Information
#
# Table name: metrics
#
#  id             :bigint           not null, primary key
#  calculated_at  :datetime         not null
#  data           :jsonb            not null
#  metadata       :jsonb
#  metric_type    :string           not null
#  period         :string           not null
#  period_date    :date
#  trackable_type :string           not null
#  value_avg      :decimal(20, 2)   default(0.0)
#  value_count    :integer          default(0)
#  value_max      :decimal(20, 2)
#  value_min      :decimal(20, 2)
#  value_sum      :decimal(20, 2)   default(0.0)
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  trackable_id   :bigint           not null
#
# Indexes
#
#  index_metrics_on_calculated_at                  (calculated_at)
#  index_metrics_on_data                           (data) USING gin
#  index_metrics_on_metadata                       (metadata) USING gin
#  index_metrics_on_metric_type                    (metric_type)
#  index_metrics_on_period                         (period)
#  index_metrics_on_period_date                    (period_date)
#  index_metrics_on_trackable                      (trackable_type,trackable_id)
#  index_metrics_on_trackable_and_type_and_period  (trackable_type,trackable_id,metric_type,period,period_date) UNIQUE
#
require "rails_helper"

RSpec.describe Metric, type: :model do
  let(:company) { create(:company) }
  let(:client) { create(:client, company: company) }
  let(:project) { create(:project, client: client) }

  describe "validations" do
    it { should validate_presence_of(:metric_type) }
    it { should validate_presence_of(:period) }
    it { should validate_presence_of(:calculated_at) }
  end

  describe "associations" do
    it { should belong_to(:trackable) }
  end

  describe ".fetch_or_calculate" do
    context "when metric exists and is fresh" do
      let!(:metric) do
        create(:metric,
          trackable: client,
          metric_type: "hours_logged",
          period: "week",
          period_date: Date.current.beginning_of_week,
          calculated_at: 1.hour.ago,
          data: { "total_minutes" => 480 }
        )
      end

      it "returns existing metric without recalculation" do
        result = Metric.fetch_or_calculate(client, "hours_logged", "week", Date.current)
        expect(result).to eq(metric)
        expect(result).not_to receive(:calculate!)
      end
    end

    context "when metric doesn't exist" do
      it "creates a new metric" do
        expect {
          Metric.fetch_or_calculate(client, "hours_logged", "week", Date.current)
        }.to change(Metric, :count).by(1)
      end

      it "calculates data for the new metric" do
        # Create some timesheet entries
        create(:timesheet_entry, project: project, duration: 120, work_date: Date.current)
        create(:timesheet_entry, project: project, duration: 60, work_date: Date.current)

        metric = Metric.fetch_or_calculate(client, "hours_logged", "week", Date.current)

        expect(metric.data["total_minutes"]).to eq(180)
        expect(metric.value_sum).to eq(180)
        expect(metric.value_count).to eq(2)
      end
    end

    context "when metric is stale" do
      let!(:metric) do
        create(:metric,
          trackable: client,
          metric_type: "hours_logged",
          period: "week",
          period_date: Date.current,
          calculated_at: 2.days.ago,
          data: { "total_minutes" => 0 }
        )
      end

      it "recalculates the metric" do
        # Add new timesheet entry after metric was calculated
        create(:timesheet_entry, project: project, duration: 240, work_date: Date.current)

        result = Metric.fetch_or_calculate(client, "hours_logged", "week", Date.current)

        expect(result.data["total_minutes"]).to eq(240)
        expect(result.calculated_at).to be > 1.minute.ago
      end
    end
  end

  describe "#calculate!" do
    let(:metric) do
      create(:metric,
        trackable: client,
        metric_type: "client_revenue",
        period: "month",
        period_date: Date.current
      )
    end

    before do
      # Create test data with issue_date in current month
      create(:invoice, client: client, amount: 1000, status: "paid", issue_date: Date.current)
      create(:invoice, client: client, amount: 500, status: "sent", issue_date: Date.current)
      create(:invoice, client: client, amount: 750, status: "overdue", issue_date: Date.current)
    end

    it "calculates client revenue metrics" do
      metric.calculate!

      expect(metric.data["total_revenue"]).to eq(2250.0)
      expect(metric.data["total_paid"]).to eq(1000.0)
      expect(metric.data["total_outstanding"]).to eq(1250.0)
      expect(metric.data["by_status"]["paid"]).to eq(1000.0)
      expect(metric.data["by_status"]["sent"]).to eq(500.0)
      expect(metric.data["by_status"]["overdue"]).to eq(750.0)
    end
  end

  describe "#stale?" do
    let(:metric) { create(:metric, calculated_at: calculated_at) }

    context "when calculated recently" do
      let(:calculated_at) { 30.minutes.ago }

      it "returns false" do
        expect(metric).not_to be_stale
      end
    end

    context "when calculated long ago" do
      let(:calculated_at) { 25.hours.ago }

      it "returns true" do
        expect(metric).to be_stale
      end
    end
  end

  describe "scopes" do
    let!(:hours_metric) { create(:metric, metric_type: "hours_logged", period: "week") }
    let!(:revenue_metric) { create(:metric, metric_type: "client_revenue", period: "month") }
    let!(:week_metric) { create(:metric, metric_type: "hours_logged", period: "week") }
    let!(:month_metric) { create(:metric, metric_type: "hours_logged", period: "month") }

    describe ".for_type" do
      it "filters by metric type" do
        expect(Metric.for_type("hours_logged")).to include(hours_metric, week_metric, month_metric)
        expect(Metric.for_type("hours_logged")).not_to include(revenue_metric)
      end
    end

    describe ".for_period" do
      it "filters by period" do
        expect(Metric.for_period("week")).to include(hours_metric, week_metric)
        expect(Metric.for_period("week")).not_to include(month_metric, revenue_metric)
      end
    end
  end
end
