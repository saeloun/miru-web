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

    permissions :index?, :show?, :create?, :update?, :destroy? do
      it "is permitted to index, show, create, update, destroy project project" do
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

    permissions :index? do
      it "is permitted to access project" do
        expect(subject).to permit(user, Project)
      end
    end

    permissions :show?, :create?, :update?, :destroy? do
      it "is not permitted to show, create, update, destroy project" do
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

  context "when user is an Book Keeper" do
    before do
      create(:company_user, company:, user:)
      user.add_role :book_keeper, company
    end

    permissions :index?, :show?, :create?, :update?, :destroy? do
      it "is not permitted to show, create, update, destroy project" do
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
end
