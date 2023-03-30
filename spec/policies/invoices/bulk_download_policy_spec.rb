# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invoices::BulkDownloadPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:invoice) { create(:invoice, client:, company:) }

  subject { described_class }

  before do
    admin.add_role :admin, company
    owner.add_role :owner, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
  end

  permissions :index? do
    it "grants bulk download permission to an admin, owner and book keeper" do
      expect(described_class).to permit(admin)
      expect(described_class).to permit(owner)
      expect(described_class).to permit(book_keeper)
    end

    it "does not grants bulk download permission to an employee" do
      expect(described_class).not_to permit(employee)
    end
  end
end
