# frozen_string_literal: true

require "rails_helper"

RSpec.describe Clients::IndexService do
  describe ".process" do
    let(:company) { create(:company) }
    let(:owner) { create(:user, current_workspace_id: company.id) }
    let!(:employment) { create(:employment, company:, user: owner) }
    let!(:client_one) { create(:client, company:, name: "Client One") }
    let!(:client_two) { create(:client, company:, name: "Client Two") }
    let!(:project_one) { create(:project, client: client_one) }
    let!(:project_two) { create(:project, client: client_two) }

    before do
      owner.add_role(:owner, company)
      create(:project_member, project: project_one, user: owner)
      create(:project_member, project: project_two, user: owner)
      create(:timesheet_entry, user: owner, project: project_one, duration: 90, work_date: Date.current)
      create(:timesheet_entry, user: owner, project: project_two, duration: 30, work_date: Date.current)
      create(:invoice, company:, client: client_one, status: :overdue, amount: 100, base_currency_amount: 100)
      create(:invoice, company:, client: client_two, status: :sent, amount: 50, base_currency_amount: 50)
    end

    it "returns aggregated minutes and invoice totals for visible clients" do
      response = described_class.process(company, owner, nil, "week")

      expect(response[:client_details].pluck(:name)).to match_array(["Client One", "Client Two"])
      expect(response[:client_details].pluck(:minutes_spent)).to match_array([90, 30])
      expect(response[:total_minutes]).to eq(120)
      expect(response[:overdue_outstanding_amount]).to eq(
        outstanding: 150.0,
        overdue: 100.0,
        currency: company.base_currency
      )
    end
  end
end
