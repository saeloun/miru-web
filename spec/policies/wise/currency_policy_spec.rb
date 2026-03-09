# frozen_string_literal: true

require "rails_helper"

RSpec.describe Wise::CurrencyPolicy, type: :policy, wise: true do
  let(:company) { create(:company) }

  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    admin.add_role :admin, company
    owner.add_role :owner, company
    employee.add_role :employee, company
  end

  permissions :index? do
    it "grants permission to an admin, employee and owner" do
      expect(described_class).to permit(admin)
      expect(described_class).to permit(owner)
      expect(described_class).to permit(employee)
    end
  end
end
