# frozen_string_literal: true

require "rails_helper"

RSpec.describe SubscriptionsPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:client_user) { create(:user, current_workspace_id: company.id) }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
    client_user.add_role :client, company
  end

  permissions :index? do
    it "permits owner and admin" do
      expect(described_class).to permit(owner, :subscription)
      expect(described_class).to permit(admin, :subscription)
    end

    it "forbids employee, book keeper, and client" do
      expect(described_class).not_to permit(employee, :subscription)
      expect(described_class).not_to permit(book_keeper, :subscription)
      expect(described_class).not_to permit(client_user, :subscription)
    end
  end
end
