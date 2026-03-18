# frozen_string_literal: true

require "rails_helper"

RSpec.describe LeavePolicy, type: :policy do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:record) { create(:leave, company:, year: 2024) }
  let(:other_workspace_user) { create(:user, current_workspace_id: other_company.id) }
  let!(:same_workspace_record) { create(:leave, company:, year: 2025) }
  let!(:other_workspace_record) { create(:leave, company: other_company, year: 2024) }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    employee.add_role :employee, company
    other_workspace_user.add_role :admin, other_company
  end

  permissions :index?, :create? do
    it "permits owner and admin" do
      expect(described_class).to permit(owner, record)
      expect(described_class).to permit(admin, record)
    end

    it "forbids employee" do
      expect(described_class).not_to permit(employee, record)
    end
  end

  permissions :update? do
    it "permits owner and admin in the same workspace" do
      expect(described_class).to permit(owner, record)
      expect(described_class).to permit(admin, record)
    end

    it "forbids employee and other workspaces" do
      expect(described_class).not_to permit(employee, record)
      expect(described_class).not_to permit(other_workspace_user, record)
    end
  end

  describe "scope" do
    it "returns only leaves in the current workspace" do
      record
      result = described_class::Scope.new(owner, Leave.all).resolve
      expect(result.pluck(:id)).to contain_exactly(record.id, same_workspace_record.id)
    end
  end
end
