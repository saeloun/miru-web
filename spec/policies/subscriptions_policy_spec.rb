# frozen_string_literal: true

require "rails_helper"

RSpec.describe SubscriptionsPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }

  before do
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
  end

  permissions :index? do
    it "grants permission to admin and owner" do
      expect(described_class).to permit(admin)
    end

    it "denies permission to an employee" do
      expect(described_class).not_to permit(employee)
    end

    it "denies permission to a book keeper" do
      expect(described_class).not_to permit(book_keeper)
    end
  end
end
