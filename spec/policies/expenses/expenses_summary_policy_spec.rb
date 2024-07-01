# frozen_string_literal: true

require "rails_helper"

RSpec.describe Expenses::ExpensesSummaryPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }

  subject { described_class }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
  end

  permissions :index? do
    it "grants permission to an admin, owner and bookkeeper" do
      expect(subject).to permit(owner)
      expect(subject).to permit(admin)
      expect(subject).to permit(book_keeper)
    end

    it "does not grants Invoice#index permission to an employee" do
      expect(subject).not_to permit(employee)
    end
  end
end
