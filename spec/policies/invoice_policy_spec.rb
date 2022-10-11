# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePolicy, type: :policy do
  let(:company) { create(:company) }
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

  permissions :index? do
    it "grants Invoice#index permission to an admin and owner" do
      expect(described_class).to permit(admin)
      expect(described_class).to permit(owner)
    end

    it "does not grants Invoice#index permission to an employee and a book keeper" do
      expect(described_class).not_to permit(employee)
      expect(described_class).to permit(book_keeper)
    end
  end

  permissions :create?, :update?, :show?, :destroy?, :edit?, :send_invoice?, :download? do
    it "grants permission to an admin and owner" do
      expect(described_class).to permit(admin)
      expect(described_class).to permit(owner)
    end

    it "does not grants permission to an employee and a book keeper" do
      expect(described_class).not_to permit(employee)
      expect(described_class).not_to permit(book_keeper)
    end
  end

  describe "#permitted_attributes" do
    subject { described_class.new(employee, company).permitted_attributes }

    let(:invoice_line_items_attributes) do
      %i[id name description date timesheet_entry_id rate quantity _destroy]
    end
    let(:attributes) do
      %i[
        issue_date due_date invoice_number reference amount outstanding_amount
        tax amount_paid amount_due discount client_id external_view_key
      ].push(invoice_line_items_attributes:)
    end

    it "returns array of an attributes" do
      expect(subject).to match_array(attributes)
    end
  end
end
