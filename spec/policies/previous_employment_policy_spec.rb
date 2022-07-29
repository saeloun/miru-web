# frozen_string_literal: true

require "rails_helper"

RSpec.describe PreviousEmploymentPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }
  let(:employee) { create(:user, current_workspace: company) }
  let(:previous_employment) { create(:previous_employment, user: employee) }

  context "when user is within the same workspace as the previous_employment user" do
    before do
      create(:employment, company:, user: employee)
    end

    context "when user is an admin" do
      before do
        user.add_role(:admin, company)
      end

      permissions :index?, :create? do
        it "grants permission for index and create" do
          expect(described_class).to permit(user)
        end
      end

      permissions :show?, :update? do
        it "grants permission for show and update" do
          expect(described_class).to permit(user, previous_employment)
        end
      end
    end

    context "when user is an owner" do
      before do
        user.add_role :owner, company
      end

      permissions :index?, :create? do
        it "grants permission for index and create" do
          expect(described_class).to permit(user)
        end
      end

      permissions :show?, :update? do
        it "grants permission for show and update" do
          expect(described_class).to permit(user, previous_employment)
        end
      end
    end

    context "when user is checking his own record" do
      before do
        user.add_role :employee, company
        create(:previous_employment, user:)
      end

      permissions :index?, :create? do
        it "grants permission for index and create" do
          expect(described_class).not_to permit(user)
        end
      end

      permissions :show?, :update? do
        it "grants permission for show and update" do
          expect(described_class).not_to permit(user, previous_employment)
        end
      end
    end

    context "when user is an employee but the record does not belong to him" do
      permissions :index?, :create? do
        it "grants permission for index and create" do
          expect(described_class).not_to permit(user)
        end
      end

      permissions :show?, :update? do
        it "grants permission for show and update" do
          expect(described_class).not_to permit(user, previous_employment)
        end
      end
    end
  end

  context "when user is not within the same workspace as the previous_employment user" do
    context "when user is an admin, owner and employee" do
      before do
        user.add_role(:admin, company)
        user.add_role(:owner, company)
        user.add_role(:employee, company)
      end

      permissions :show?, :update? do
        it "does not grant permission for show and update" do
          expect(described_class).not_to permit(user, previous_employment)
        end
      end
    end
  end
end
