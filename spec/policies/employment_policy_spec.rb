# frozen_string_literal: true

require "rails_helper"

RSpec.describe EmploymentPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:member) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:other_workspace_user) { create(:user, current_workspace_id: other_company.id) }
  let(:record) { create(:employment, company:, user: member) }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
    other_workspace_user.add_role :admin, other_company
  end

  permissions :index? do
    it "permits owner and admin" do
      expect(described_class).to permit(owner, record)
      expect(described_class).to permit(admin, record)
    end

    it "forbids employee and book keeper" do
      expect(described_class).not_to permit(employee, record)
      expect(described_class).not_to permit(book_keeper, record)
    end
  end

  permissions :show?, :update? do
    it "permits owner and admin in the same workspace" do
      expect(described_class).to permit(owner, record)
      expect(described_class).to permit(admin, record)
    end

    it "permits self-service for employee and book keeper" do
      self_employment = create(:employment, company:, user: employee)
      self_book_keeper_employment = create(:employment, company:, user: book_keeper)
      expect(described_class).to permit(employee, self_employment)
      expect(described_class).to permit(book_keeper, self_book_keeper_employment)
    end

    it "forbids another employee and another workspace" do
      expect(described_class).not_to permit(employee, record)
      expect(described_class).not_to permit(book_keeper, record)
      expect(described_class).not_to permit(other_workspace_user, record)
    end
  end
end
