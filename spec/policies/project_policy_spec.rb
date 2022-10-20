# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }

  let(:another_company) { create(:company) }
  let(:another_admin) { create(:user, current_workspace_id: another_company.id) }
  let(:another_employee) { create(:user, current_workspace_id: another_company.id) }
  let(:another_owner) { create(:user, current_workspace_id: another_company.id) }
  let(:another_book_keeper) { create(:user, current_workspace_id: another_company.id) }

  before do
    admin.add_role :admin, company
    owner.add_role :owner, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company

    another_owner.add_role :owner, another_company
    another_admin.add_role :admin, another_company
    another_employee.add_role :employee, another_company
    another_book_keeper.add_role :book_keeper, another_company
  end

  subject { described_class }

  permissions :index? do
    context "when user is an admin or owner or employee" do
      it "grants permission" do
        expect(described_class).to permit(admin, Project)
        expect(described_class).to permit(owner, Project)
        expect(described_class).to permit(employee, Project)
      end

      context "when user is book keeper" do
        it "does not grants permission" do
          expect(described_class).not_to permit(book_keeper, Project)
        end
      end
    end
  end

  permissions :create? do
    context "when user is an admin or owner" do
      it "grants permission" do
        expect(described_class).to permit(admin, Project)
        expect(described_class).to permit(owner, Project)
      end

      context "when user is employee or book keeper" do
        it "does not grants permission" do
          expect(described_class).not_to permit(employee, Project)
          expect(described_class).not_to permit(book_keeper, Project)
        end
      end
    end
  end

  permissions :show?, :update?, :destroy? do
    context "when user is an admin or owner" do
      it "grants permission" do
        expect(described_class).to permit(admin, project)
        expect(described_class).to permit(owner, project)
      end
    end

    context "when user is an employee or book_keeper" do
      it "does not grants permission" do
        expect(described_class).not_to permit(employee, project)
        expect(described_class).not_to permit(book_keeper, project)
      end
    end

    context "when user is from another company" do
      it "does not grants permission" do
        expect(described_class).not_to permit(another_admin, project)
        expect(described_class).not_to permit(another_owner, project)
        expect(described_class).not_to permit(another_employee, project)
        expect(described_class).not_to permit(another_book_keeper, project)
      end
    end
  end
end
