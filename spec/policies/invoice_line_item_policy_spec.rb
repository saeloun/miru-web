# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoiceLineItemPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:client) { create(:client, company:) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }

  let(:another_company) { create(:company) }
  let(:another_admin) { create(:user, current_workspace_id: another_company.id) }
  let(:another_employee) { create(:user, current_workspace_id: another_company.id) }
  let(:another_owner) { create(:user, current_workspace_id: another_company.id) }
  let(:another_book_keeper) { create(:user, current_workspace_id: another_company.id) }

  subject(:policy) { described_class }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company

    another_owner.add_role :owner, another_company
    another_admin.add_role :admin, another_company
    another_employee.add_role :employee, another_company
    another_book_keeper.add_role :book_keeper, another_company
  end

  permissions :index? do
    it "permits owners and admins in the same workspace" do
      expect(policy).to permit(admin, client)
      expect(policy).to permit(owner, client)
    end

    it "rejects non-finance roles in the same workspace" do
      expect(policy).not_to permit(employee, client)
      expect(policy).not_to permit(book_keeper, client)
    end

    it "rejects users from another workspace" do
      expect(policy).not_to permit(another_admin, client)
      expect(policy).not_to permit(another_owner, client)
      expect(policy).not_to permit(another_employee, client)
      expect(policy).not_to permit(another_book_keeper, client)
    end
  end
end
