# frozen_string_literal: true

require "rails_helper"

RSpec.describe ReportPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    admin.add_role :admin, company
    owner.add_role :owner, company
    employee.add_role :employee, company
  end

  permissions :index?, :download? do
    it "grants permission to owner and admin" do
      expect(described_class).to permit(admin)
      expect(described_class).to permit(owner)
    end

    it "denies permission to employee" do
      expect(described_class).not_to permit(employee)
    end
  end
end
