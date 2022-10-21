# frozen_string_literal: true

require "rails_helper"

RSpec.describe GenerateInvoicePolicy, type: :policy do
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

  subject { described_class }

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
    context "when user is an admin or owner" do
      it "grants permission" do
        expect(described_class).to permit(admin, client)
        expect(described_class).to permit(owner, client)
      end
    end

    context "when user is an employee, book_keeper" do
      it "does not grant permission" do
        expect(described_class).not_to permit(employee, client)
        expect(described_class).not_to permit(book_keeper, client)
      end
    end

    context "when user is from another company" do
      it "does not grants permission" do
        expect(described_class).not_to permit(another_admin, client)
        expect(described_class).not_to permit(another_owner, client)
        expect(described_class).not_to permit(another_employee, client)
        expect(described_class).not_to permit(another_book_keeper, client)
      end
    end
  end
end
