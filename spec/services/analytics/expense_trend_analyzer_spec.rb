# frozen_string_literal: true

require "rails_helper"

RSpec.describe Analytics::ExpenseTrendAnalyzer do
  describe "#process" do
    let(:company) { create(:company) }
    let(:client) { create(:client, company:) }
    let(:travel_category) { create(:expense_category, company:, name: "Travel") }
    let(:software_category) { create(:expense_category, company:, name: "Software") }
    let(:project_alpha) { create(:project, client:, name: "Alpha Project", billable: true) }
    let(:project_beta) { create(:project, client:, name: "Beta Project", billable: true) }
    let(:from) { Date.new(2026, 1, 1) }
    let(:to) { Date.new(2026, 3, 31) }

    before do
      create(:expense, company:, expense_category: travel_category, category_name: nil, project: project_alpha, date: Date.new(2026, 1, 5), amount: 100)
      create(:expense, company:, expense_category: travel_category, category_name: nil, project: project_alpha, date: Date.new(2026, 2, 5), amount: 100)
      create(:expense, company:, expense_category: travel_category, category_name: nil, project: project_alpha, date: Date.new(2026, 3, 5), amount: 500)
      create(:expense, company:, expense_category: software_category, category_name: nil, project: project_beta, date: Date.new(2026, 2, 10), amount: 200)
    end

    it "returns category and project trends with anomaly detection" do
      result = described_class.new(company:, from:, to:).process

      expect(result[:summary]).to include(
        total_expenses: 900.0,
        expense_count: 4,
        category_count: 2,
        project_count: 2,
        anomaly_count: 1
      )

      expect(result[:category_trends].first).to include(name: "Travel", total_amount: 700.0)
      expect(result[:project_trends].first).to include(name: "Alpha Project", total_amount: 700.0)
      expect(result[:anomalies]).to contain_exactly(
        include(
          dimension: "category",
          name: "Travel",
          month: "2026-03-01",
          amount: 500.0,
          rolling_average: 100.0,
          threshold: 150.0
        )
      )
    end

    it "supports project filtering" do
      result = described_class.new(company:, from:, to:, project_ids: [project_beta.id]).process

      expect(result[:summary][:total_expenses]).to eq(200.0)
      expect(result[:project_trends].pluck(:name)).to eq(["Beta Project"])
    end
  end
end
