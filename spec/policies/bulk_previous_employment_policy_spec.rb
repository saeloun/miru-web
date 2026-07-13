# frozen_string_literal: true

require "rails_helper"
RSpec.describe BulkPreviousEmploymentPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:colleague) { create(:user, current_workspace_id: company.id) }

  subject { described_class }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
  end

  permissions :update? do
    context "when user is an owner" do
      it "grants permission to edit any member" do
        expect(described_class).to permit(owner, colleague)
      end
    end

    context "when user is an admin" do
      it "grants permission to edit any member" do
        expect(described_class).to permit(admin, colleague)
      end
    end

    context "when user is an employee editing their own record" do
      it "grants permission" do
        expect(described_class).to permit(employee, employee)
      end
    end

    context "when user is an employee editing another member" do
      it "denies permission" do
        expect(described_class).not_to permit(employee, colleague)
      end
    end

    context "when user is a book keeper editing another member" do
      it "denies permission" do
        expect(described_class).not_to permit(book_keeper, colleague)
      end
    end
  end
end
