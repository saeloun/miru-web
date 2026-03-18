# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectMemberPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:client) { create(:client, company:) }
  let(:record) { create(:project, client:) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:other_workspace_user) { create(:user, current_workspace_id: other_company.id) }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    employee.add_role :employee, company
    other_workspace_user.add_role :admin, other_company
  end

  permissions :update? do
    it "permits owner and admin in the same workspace" do
      expect(described_class).to permit(owner, record)
      expect(described_class).to permit(admin, record)
    end

    it "forbids employee and other workspace users" do
      expect(described_class).not_to permit(employee, record)
      expect(described_class).not_to permit(other_workspace_user, record)
    end
  end
end
