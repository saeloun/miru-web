# frozen_string_literal: true

require "rails_helper"

RSpec.describe AuditLogPolicy, type: :policy do
  let(:company) { create(:company, plan_tier: "paid") }
  let(:free_company) { create(:company, plan_tier: "free") }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:free_owner) { create(:user, current_workspace_id: free_company.id) }

  before do
    admin.add_role :admin, company
    owner.add_role :owner, company
    employee.add_role :employee, company
    free_owner.add_role :owner, free_company
  end

  permissions :index? do
    it "allows paid workspace admins and owners" do
      expect(described_class).to permit(admin, :audit_log)
      expect(described_class).to permit(owner, :audit_log)
    end

    it "denies non-admins and free workspaces" do
      expect(described_class).not_to permit(employee, :audit_log)
      expect(described_class).not_to permit(free_owner, :audit_log)
    end
  end
end
