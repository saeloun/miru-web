# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::AccountsAging::FetchOverdueAmount do
  describe ".process" do
    let(:company) { create(:company) }
    let!(:client_one) { create(:client, company:, name: "Client One") }
    let!(:client_two) { create(:client, company:, name: "Client Two") }
    let!(:project_one) { create(:project, client: client_one, billable: true) }
    let!(:project_two) { create(:project, client: client_two, billable: true) }

    before do
      create(
        :invoice,
        company:,
        client: client_one,
        status: :overdue,
        issue_date: 30.days.ago.to_date,
        due_date: 10.days.ago.to_date,
        amount: 100,
        amount_due: 50,
        base_currency_amount: 100
      )
      create(
        :invoice,
        company:,
        client: client_two,
        status: :sent,
        issue_date: 60.days.ago.to_date,
        due_date: 45.days.ago.to_date,
        amount: 80,
        amount_due: 80,
        base_currency_amount: 0
      )
    end

    it "returns grouped aging totals for clients and the overall report" do
      result = described_class.process(company)

      expect(result[:base_currency]).to eq(company.base_currency)
      expect(result[:clients].pluck(:name)).to eq(["Client Two", "Client One"])
      expect(result[:clients].find { |client| client[:name] == "Client One" }[:amount_overdue]).to eq(
        zero_to_thirty_days: 50.0,
        thirty_one_to_sixty_days: 0.0,
        sixty_one_to_ninety_days: 0.0,
        ninety_plus_days: 0.0,
        total: 50.0
      )
      expect(result[:total_amount_overdue_by_date_range]).to eq(
        zero_to_thirty_days: 50.0,
        thirty_one_to_sixty_days: 80.0,
        sixty_one_to_ninety_days: 0.0,
        ninety_plus_days: 0.0,
        total: 130.0
      )
    end
  end
end
