# frozen_string_literal: true

require "rails_helper"

RSpec.describe ClientPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:another_company) { create(:company) }

  let(:client) { create(:client, company:) }
  let(:another_client) { create(:client, company: another_company) }

  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
  end

  permissions :index? do
    it "grants permission to an admin, employee and owner" do
      expect(described_class).to permit(owner)
      expect(described_class).to permit(admin)
      expect(described_class).to permit(employee)
    end

    it "does not grants permission to book_keeper" do
      expect(described_class).not_to permit(book_keeper)
    end
  end

  permissions :show?, :create?, :new_invoice_line_items? do
    it "grants permission to an admin and an owner" do
      expect(described_class).to permit(admin)
      expect(described_class).to permit(owner)
    end

    it "does not grants permission to an employee, book_keeper" do
      expect(described_class).not_to permit(employee)
      expect(described_class).not_to permit(book_keeper)
    end
  end

  permissions :update?, :destroy? do
    context "when user is an admin or owner" do
      it "grants permission" do
        expect(described_class).to permit(admin, client)
        expect(described_class).to permit(owner, client)
      end

      context "when from another company" do
        it "does not grants permission" do
          expect(described_class).not_to permit(admin, another_client)
          expect(described_class).not_to permit(owner, another_client)
        end
      end
    end

    context "when user is an employee, book_keeper" do
      it "does not grant permission" do
        expect(described_class).not_to permit(employee, client)
        expect(described_class).not_to permit(employee, another_client)
        expect(described_class).not_to permit(book_keeper, client)
        expect(described_class).not_to permit(book_keeper, another_client)
      end
    end
  end

  describe "#permitted_attributes" do
    subject { described_class.new(admin, company).permitted_attributes }

    it "returns array of a permitted attributes" do
      expect(subject).to match_array(%i[name email phone address])
    end
  end
end
