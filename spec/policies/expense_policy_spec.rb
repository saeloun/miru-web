# frozen_string_literal: true

require "rails_helper"

RSpec.describe ExpensePolicy, type: :policy do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:other_employee) { create(:user, current_workspace_id: company.id) }
  let(:outsider) { create(:user, current_workspace_id: other_company.id) }
  let(:expense) { create(:expense, company:, user: employee) }
  let(:paid_expense) { create(:expense, :paid, company:, user: employee) }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    book_keeper.add_role :book_keeper, company
    employee.add_role :employee, company
    other_employee.add_role :employee, company
    outsider.add_role :admin, other_company
  end

  permissions :index?, :create? do
    it "permits elevated roles and employees" do
      expect(described_class).to permit(owner, Expense)
      expect(described_class).to permit(admin, Expense)
      expect(described_class).to permit(book_keeper, Expense)
      expect(described_class).to permit(employee, Expense)
    end
  end

  permissions :show?, :update? do
    it "permits elevated roles in the same workspace" do
      expect(described_class).to permit(owner, expense)
      expect(described_class).to permit(admin, expense)
      expect(described_class).to permit(book_keeper, expense)
    end

    it "permits an employee on their own expense" do
      expect(described_class).to permit(employee, expense)
    end

    it "forbids another employee" do
      expect(described_class).not_to permit(other_employee, expense)
    end

    it "forbids users from another workspace" do
      expect(described_class).not_to permit(outsider, expense)
    end
  end

  permissions :destroy? do
    it "permits owner and admin in the same workspace" do
      expect(described_class).to permit(owner, expense)
      expect(described_class).to permit(admin, expense)
    end

    it "permits an employee on their own unpaid expense" do
      expect(described_class).to permit(employee, expense)
    end

    it "forbids book keepers" do
      expect(described_class).not_to permit(book_keeper, expense)
    end

    it "forbids paid expenses" do
      expect(described_class).not_to permit(owner, paid_expense)
      expect(described_class).not_to permit(employee, paid_expense)
    end
  end

  permissions :mark_paid?, :approve?, :reject? do
    it "permits elevated roles in the same workspace" do
      expect(described_class).to permit(owner, expense)
      expect(described_class).to permit(admin, expense)
      expect(described_class).to permit(book_keeper, expense)
    end

    it "forbids employees and outsiders" do
      expect(described_class).not_to permit(employee, expense)
      expect(described_class).not_to permit(outsider, expense)
    end
  end
end
