# frozen_string_literal: true

require "rails_helper"

RSpec.describe TeamMembers::NotificationPreferencePolicy, type: :policy do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:member) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:other_workspace_user) { create(:user, current_workspace_id: other_company.id) }
  let(:record) { build(:notification_preference, user: member, company:) }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    employee.add_role :employee, company
    other_workspace_user.add_role :admin, other_company
  end

  permissions :show?, :update? do
    it "permits owner and admin in the same workspace" do
      expect(described_class).to permit(owner, record)
      expect(described_class).to permit(admin, record)
    end

    it "permits the team member on their own preference" do
      expect(described_class).to permit(member, record)
    end

    it "forbids another employee and other workspaces" do
      expect(described_class).not_to permit(employee, record)
      expect(described_class).not_to permit(other_workspace_user, record)
    end

    it "forbids nil records" do
      expect(described_class).not_to permit(owner, nil)
    end
  end
end
