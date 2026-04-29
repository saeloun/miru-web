# frozen_string_literal: true

require "rails_helper"

RSpec.describe AnalyticsPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:manager) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:client_user) { create(:user, current_workspace_id: company.id) }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    manager.add_role :manager, company
    book_keeper.add_role :book_keeper, company
    employee.add_role :employee, company
    client_user.add_role :client, company
  end

  permissions :index? do
    it "allows workspace analytics surfaces for non-client roles" do
      expect(described_class).to permit(owner, :analytics)
      expect(described_class).to permit(admin, :analytics)
      expect(described_class).to permit(manager, :analytics)
      expect(described_class).to permit(book_keeper, :analytics)
      expect(described_class).to permit(employee, :analytics)
      expect(described_class).not_to permit(client_user, :analytics)
    end
  end

  permissions :revenue_forecast? do
    it "allows only financial analytics roles" do
      expect(described_class).to permit(owner, :analytics)
      expect(described_class).to permit(admin, :analytics)
      expect(described_class).to permit(manager, :analytics)
      expect(described_class).to permit(book_keeper, :analytics)
      expect(described_class).not_to permit(employee, :analytics)
      expect(described_class).not_to permit(client_user, :analytics)
    end
  end

  permissions :comparison? do
    it "matches financial analytics access" do
      expect(described_class).to permit(owner, :analytics)
      expect(described_class).to permit(admin, :analytics)
      expect(described_class).to permit(manager, :analytics)
      expect(described_class).to permit(book_keeper, :analytics)
      expect(described_class).not_to permit(employee, :analytics)
      expect(described_class).not_to permit(client_user, :analytics)
    end
  end

  permissions :team_productivity? do
    it "allows self analytics roles and denies clients" do
      expect(described_class).to permit(owner, :analytics)
      expect(described_class).to permit(admin, :analytics)
      expect(described_class).to permit(manager, :analytics)
      expect(described_class).to permit(book_keeper, :analytics)
      expect(described_class).to permit(employee, :analytics)
      expect(described_class).not_to permit(client_user, :analytics)
    end
  end

  permissions :client_analysis? do
    it "allows only financial analytics roles" do
      expect(described_class).to permit(owner, :analytics)
      expect(described_class).to permit(admin, :analytics)
      expect(described_class).to permit(manager, :analytics)
      expect(described_class).to permit(book_keeper, :analytics)
      expect(described_class).not_to permit(employee, :analytics)
      expect(described_class).not_to permit(client_user, :analytics)
    end
  end

  permissions :expense_trends? do
    it "allows only financial analytics roles" do
      expect(described_class).to permit(owner, :analytics)
      expect(described_class).to permit(admin, :analytics)
      expect(described_class).to permit(manager, :analytics)
      expect(described_class).to permit(book_keeper, :analytics)
      expect(described_class).not_to permit(employee, :analytics)
      expect(described_class).not_to permit(client_user, :analytics)
    end
  end
end
