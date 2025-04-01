# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePolicy, type: :policy do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:invoice) { create(:invoice, client:, company:) }

  let(:another_company) { create(:company) }
  let(:another_admin) { create(:user, current_workspace_id: another_company.id) }
  let(:another_employee) { create(:user, current_workspace_id: another_company.id) }
  let(:another_owner) { create(:user, current_workspace_id: another_company.id) }
  let(:another_book_keeper) { create(:user, current_workspace_id: another_company.id) }
  let(:client_member) { create(:user, current_workspace_id: company.id) }

  subject { described_class }

  before do
    admin.add_role :admin, company
    owner.add_role :owner, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
    client_member.add_role :client, company

    another_owner.add_role :owner, another_company
    another_admin.add_role :admin, another_company
    another_employee.add_role :employee, another_company
    another_book_keeper.add_role :book_keeper, another_company
  end

  permissions :index? do
    it "grants Invoice#index permission to an admin, owner and book keeper" do
      expect(described_class).to permit(admin)
      expect(described_class).to permit(owner)
      expect(described_class).to permit(book_keeper)
    end

    it "does not grants Invoice#index permission to an employee" do
      expect(described_class).not_to permit(employee)
    end
  end

  permissions :create? do
    it "grants permission to an admin and owner" do
      expect(described_class).to permit(admin)
      expect(described_class).to permit(owner)
    end

    it "does not grants permission to an employee and a book keeper" do
      expect(described_class).not_to permit(employee)
      expect(described_class).not_to permit(book_keeper)
    end
  end

  permissions :show?, :download? do
    context "when user is an admin, owner, client or book keeper" do
      it "grants permission" do
        expect(described_class).to permit(admin, invoice)
        expect(described_class).to permit(owner, invoice)
        expect(described_class).to permit(book_keeper, invoice)
        expect(described_class).to permit(client_member, invoice)
      end
    end

    context "when user is an employee" do
      it "does not grants permission" do
        expect(described_class).not_to permit(employee, invoice)
      end
    end
  end

  permissions :edit?, :update?, :destroy?, :send_invoice? do
    context "when user is an admin or owner" do
      it "grants permission" do
        expect(described_class).to permit(admin, invoice)
        expect(described_class).to permit(owner, invoice)
      end
    end

    context "when user is an employee or book_keeper" do
      it "does not grants permission" do
        expect(described_class).not_to permit(employee, invoice)
        expect(described_class).not_to permit(book_keeper, invoice)
      end
    end

    context "when user is from another company" do
      it "does not grants permission" do
        expect(described_class).not_to permit(another_admin, invoice)
        expect(described_class).not_to permit(another_owner, invoice)
        expect(described_class).not_to permit(another_employee, invoice)
        expect(described_class).not_to permit(another_book_keeper, invoice)
      end
    end
  end

  describe "#permitted_attributes" do
    subject { described_class.new(employee, company).permitted_attributes }

    let(:invoice_line_items_attributes) do
      %i[id name description date timesheet_entry_id rate quantity _destroy]
    end
    let(:attributes) do
      %i[
        issue_date due_date status invoice_number reference amount outstanding_amount
        tax amount_paid amount_due discount client_id external_view_key stripe_enabled
        base_currency_amount currency
      ].push(invoice_line_items_attributes:)
    end

    it "returns array of an attributes" do
      expect(subject).to match_array(attributes)
    end
  end
end
