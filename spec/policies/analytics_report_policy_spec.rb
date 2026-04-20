# frozen_string_literal: true

require "rails_helper"

RSpec.describe AnalyticsReportPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:manager) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:client_user) { create(:user, current_workspace_id: company.id) }
  let(:creator_report) { create(:analytics_report, company:, creator: owner, report_type: :team_productivity) }
  let(:financial_report) { create(:analytics_report, company:, creator: owner, report_type: :revenue_forecast) }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    book_keeper.add_role :book_keeper, company
    manager.add_role :manager, company
    employee.add_role :employee, company
    client_user.add_role :client, company
  end

  permissions :index?, :show? do
    it "allows workspace analytics readers and denies clients" do
      expect(described_class).to permit(owner, creator_report)
      expect(described_class).to permit(admin, creator_report)
      expect(described_class).to permit(book_keeper, creator_report)
      expect(described_class).to permit(manager, creator_report)
      expect(described_class).to permit(employee, creator_report)
      expect(described_class).not_to permit(client_user, creator_report)
    end
  end

  permissions :create? do
    it "allows financial roles to create financial reports" do
      expect(described_class).to permit(owner, financial_report)
      expect(described_class).to permit(admin, financial_report)
      expect(described_class).to permit(book_keeper, financial_report)
      expect(described_class).to permit(manager, financial_report)
      expect(described_class).not_to permit(employee, financial_report)
    end

    it "allows self-analytics reports for employees" do
      employee_report = build(:analytics_report, company:, creator: employee, report_type: :team_productivity)

      expect(described_class).to permit(employee, employee_report)
    end
  end

  permissions :destroy? do
    it "allows only the creator to delete the report" do
      expect(described_class).to permit(owner, creator_report)
      expect(described_class).not_to permit(admin, creator_report)
      expect(described_class).not_to permit(manager, creator_report)
      expect(described_class).not_to permit(employee, creator_report)
    end
  end
end
