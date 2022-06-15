# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  subject { described_class }

  context "when user is an admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
    end

    permissions :create? do
      it "is permitted to create project" do
        expect(subject).to permit(user, Project)
      end
    end

    # Will move this to correct file once commit changes get approved
    # permissions :update_members? do
    #   it "is permitted to update project members" do
    #     expect(subject).to permit(user, Project)
    #   end
    # end
  end

  context "when user is an employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
    end

    permissions :create? do
      it "is not permitted to create project" do
        expect(subject).not_to permit(user, Project)
      end
    end

    # Will move this to correct file once commit changes get approved
    # permissions :update_members? do
    #   it "is not permitted to update project members" do
    #     expect(subject).not_to permit(user, Project)
    #   end
    # end
  end

  context "when user is a book keeper" do
    before do
      create(:company_user, company:, user:)
      user.add_role :book_keeper, company
    end

    permissions :index?, :create?, :update?, :show?, :destroy? do
      it "is not permitted to create project" do
        expect(subject).not_to permit(user, Project)
      end
    end
  end
end
