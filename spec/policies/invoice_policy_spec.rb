# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePolicy, type: :policy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  subject { described_class }

  context "when user is an admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
    end

    permissions :index?, :show?, :create?, :update?, :send_invoice? do
      it "is permitted to access index, show, create, update, send_invoice" do
        expect(subject).to permit(user, :invoice)
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
    end

    permissions :index?, :show?, :create?, :update?, :send_invoice? do
      it "is not permitted to access index, show, create, update, send_invoice" do
        expect(subject).not_to permit(user, :invoice)
      end
    end
  end

  context "when user is an Book Keeper" do
    before do
      create(:company_user, company:, user:)
      user.add_role :book_keeper, company
    end

    permissions :index? do
      it "is permitted to access index" do
        expect(subject).to permit(user, :invoice)
      end
    end

    permissions :show? do
      it "is not permitted to access index" do
        expect(subject).not_to permit(user, :invoice)
      end
    end

    permissions :create? do
      it "is not permitted to access create" do
        expect(subject).not_to permit(user, :invoice)
      end
    end

    permissions :update? do
      it "is not permitted to access update" do
        expect(subject).not_to permit(user, :invoice)
      end
    end

    permissions :send_invoice? do
      it "is not permitted to access send_invoice" do
        expect(subject).not_to permit(user, :invoice)
      end
    end
  end
end
