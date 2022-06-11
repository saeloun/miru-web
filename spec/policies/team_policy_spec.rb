# frozen_string_literal: true

require "rails_helper"

RSpec.describe TeamPolicy, type: :policy, test_ploi: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  subject { described_class }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
    end

    permissions :edit?, :update?, :destroy? do
      it "is permitted to access team" do
        expect(subject).to permit(user, :team)
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
    end

    permissions :edit?, :update?, :destroy? do
      it "is not permitted to access team" do
        expect(subject).not_to permit(user, :team)
      end
    end
  end

  context "when user is book keeper" do
    before do
      create(:company_user, company:, user:)
      user.add_role :book_keeper, company
    end

    permissions :index?, :edit?, :update?, :destroy? do
      it "is not permitted to access team" do
        expect(subject).not_to permit(user, :team)
      end
    end
  end
end
