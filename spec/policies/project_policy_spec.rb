# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:another_company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }

  before do
    admin.add_role :admin, company
    owner.add_role :owner, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
  end

  subject { described_class }

  permissions :index? do
    context "when user is an admin or owner" do
      it "grants permission" do
        expect(described_class).to permit(admin, Project)
        expect(described_class).to permit(owner, Project)
      end

      context "when user is employee or book keeper" do
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
      let(:client) { create(:client, company:) }
      let(:project) { create(:project, client:) }

      it "grants permission" do
        expect(described_class).to permit(admin, project)
        expect(described_class).to permit(owner, project)
      end

      context "when from another company" do
        let(:another_admin) { create(:user, current_workspace_id: another_company.id) }
        let(:another_owner) { create(:user, current_workspace_id: another_company.id) }

        it "does not grants permission" do
          expect(described_class).not_to permit(another_admin, project)
          expect(described_class).not_to permit(another_owner, project)
        end
      end
    end
  end
end
