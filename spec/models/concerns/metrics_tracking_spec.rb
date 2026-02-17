# frozen_string_literal: true

require "rails_helper"

RSpec.describe MetricsTracking, type: :concern do
  let(:company) { create(:company) }
  let(:client) { create(:client, company: company) }
  let(:project) { create(:project, client: client) }

  describe "included models" do
    it "adds metrics association to Client" do
      expect(client).to respond_to(:metrics)
      expect(client.metrics).to be_a(ActiveRecord::Associations::CollectionProxy)
    end

    it "adds metrics association to Project" do
      expect(project).to respond_to(:metrics)
      expect(project.metrics).to be_a(ActiveRecord::Associations::CollectionProxy)
    end

    it "adds metrics association to Company" do
      expect(company).to respond_to(:metrics)
      expect(company.metrics).to be_a(ActiveRecord::Associations::CollectionProxy)
    end
  end

  describe "#metric" do
    it "fetches or calculates a metric" do
      expect(Metric).to receive(:fetch_or_calculate).with(client, :hours_logged, :week, Date.current)
      client.metric(:hours_logged, :week)
    end

    it "uses default values for period and date" do
      expect(Metric).to receive(:fetch_or_calculate).with(client, :hours_logged, :week, Date.current)
      client.metric(:hours_logged)
    end
  end

  describe "#metric_data" do
    let!(:metric) do
      create(:metric,
        trackable: client,
        metric_type: "hours_logged",
        period: "week",
        data: { "total_minutes" => 480, "entries" => 5 }
      )
    end

    it "returns the data hash from the metric" do
      allow(Metric).to receive(:fetch_or_calculate).and_return(metric)

      data = client.metric_data(:hours_logged, :week)
      expect(data).to eq({ "total_minutes" => 480, "entries" => 5 })
    end
  end

  describe "#hours_logged_metric" do
    it "fetches hours logged metric for specified period" do
      expect(client).to receive(:metric).with(:hours_logged, :month)
      client.hours_logged_metric(:month)
    end

    it "defaults to week period" do
      expect(client).to receive(:metric).with(:hours_logged, :week)
      client.hours_logged_metric
    end
  end

  describe "#revenue_metric" do
    it "fetches revenue metric for specified period" do
      expect(client).to receive(:metric).with(:client_revenue, :quarter)
      client.revenue_metric(:quarter)
    end

    it "defaults to month period" do
      expect(client).to receive(:metric).with(:client_revenue, :month)
      client.revenue_metric
    end
  end

  describe "#outstanding_amounts_metric" do
    it "fetches outstanding amounts metric for all time" do
      expect(client).to receive(:metric).with(:outstanding_amounts, :all_time)
      client.outstanding_amounts_metric
    end
  end

  describe "#recalculate_metrics!" do
    let!(:metric1) { create(:metric, trackable: client, metric_type: "hours_logged") }
    let!(:metric2) { create(:metric, trackable: client, metric_type: "client_revenue") }

    it "recalculates all metrics for the trackable" do
      expect(metric1).to receive(:calculate!)
      expect(metric2).to receive(:calculate!)

      allow(client.metrics).to receive(:each).and_yield(metric1).and_yield(metric2)

      client.recalculate_metrics!
    end
  end

  describe "#metrics_for_range" do
    let!(:metric1) { create(:metric, trackable: client, metric_type: "hours_logged", period_date: Date.current) }
    let!(:metric2) { create(:metric, trackable: client, metric_type: "hours_logged", period_date: 1.week.ago) }
    let!(:metric3) { create(:metric, trackable: client, metric_type: "hours_logged", period_date: 2.weeks.ago) }
    let!(:metric4) { create(:metric, trackable: client, metric_type: "client_revenue", period_date: Date.current) }

    it "returns metrics of specified type within date range" do
      results = client.metrics_for_range("hours_logged", 10.days.ago, Date.current)

      expect(results).to include(metric1, metric2)
      expect(results).not_to include(metric3, metric4)
      expect(results.first.period_date).to be <= results.last.period_date
    end
  end

  describe "#total_hours_logged_cached" do
    before do
      allow(client).to receive(:metric_data).with(:hours_logged, "week").and_return({
        "total_minutes" => 720
      })
    end

    it "returns total minutes from cached metric data" do
      expect(client.total_hours_logged_cached("week")).to eq(720)
    end

    it "returns 0 when no data exists" do
      allow(client).to receive(:metric_data).and_return({})
      expect(client.total_hours_logged_cached("week")).to eq(0)
    end
  end

  describe "#client_revenue_cached" do
    before do
      allow(client).to receive(:metric_data).with(:client_revenue, "month").and_return({
        "total_revenue" => 5000,
        "total_outstanding" => 2000,
        "total_paid" => 3000
      })
    end

    it "returns revenue summary from cached metric data" do
      result = client.client_revenue_cached("month")

      expect(result[:total]).to eq(5000)
      expect(result[:outstanding]).to eq(2000)
      expect(result[:paid]).to eq(3000)
    end

    it "returns zeros when no data exists" do
      allow(client).to receive(:metric_data).and_return({})
      result = client.client_revenue_cached("month")

      expect(result[:total]).to eq(0)
      expect(result[:outstanding]).to eq(0)
      expect(result[:paid]).to eq(0)
    end
  end

  describe "#outstanding_summary_cached" do
    before do
      allow(client).to receive(:metric_data).with(:outstanding_amounts, :all_time).and_return({
        "total_outstanding" => 8000,
        "overdue_amount" => 3000,
        "by_status" => { "sent" => 5000, "overdue" => 3000 }
      })
    end

    it "returns outstanding summary from cached metric data" do
      result = client.outstanding_summary_cached

      expect(result[:total]).to eq(8000)
      expect(result[:overdue]).to eq(3000)
      expect(result[:by_status]).to eq({ "sent" => 5000, "overdue" => 3000 })
    end

    it "returns defaults when no data exists" do
      allow(client).to receive(:metric_data).and_return({})
      result = client.outstanding_summary_cached

      expect(result[:total]).to eq(0)
      expect(result[:overdue]).to eq(0)
      expect(result[:by_status]).to eq({})
    end
  end
end
