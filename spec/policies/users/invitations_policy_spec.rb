# frozen_string_literal: true

require "rails_helper"

RSpec.describe Users::InvitationsPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
    end

    permissions :create? do
      it "is permitted to create invitation" do
        expect(described_class).to permit(user)
      end
    end
  end

  context "when user is an owner" do
    before do
      create(:employment, company:, user:)
      user.add_role :owner, company
    end

    permissions :create? do
      it "is permitted to create invitation" do
        expect(described_class).to permit(user)
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
    end

    permissions :create? do
      it "is not permitted to create invitation" do
        expect(described_class).not_to permit(user)
      end
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
    end

    permissions :create? do
      it "is not permitted to create invitation" do
        expect(described_class).not_to permit(user)
      end
    end
  end
end
