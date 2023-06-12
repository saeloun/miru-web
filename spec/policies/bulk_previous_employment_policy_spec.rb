# frozen_string_literal: true

require "rails_helper"
RSpec.describe BulkPreviousEmploymentPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:previous_employment_employee) { create(:previous_employment, user: employee) }

  subject { described_class }

  before do
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
  end

  permissions :update? do
    context "when user is an admin" do
      it "grants permission" do
        expect(described_class).to permit(admin, previous_employment_employee)
      end
    end

    context "when user is an employee or book keeper" do
      it "does not grants permission" do
        expect(described_class).not_to permit(employee, previous_employment_employee)
        expect(described_class).not_to permit(book_keeper, previous_employment_employee)
      end
    end
  end
end
