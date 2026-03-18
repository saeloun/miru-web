# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invoices::ActionTrailsPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    employee.add_role :employee, company
  end

  permissions :show? do
    it "permits owner and admin" do
      expect(described_class).to permit(owner, :show)
      expect(described_class).to permit(admin, :show)
    end

    it "forbids employee" do
      expect(described_class).not_to permit(employee, :show)
    end
  end
end
