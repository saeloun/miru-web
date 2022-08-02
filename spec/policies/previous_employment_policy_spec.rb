# frozen_string_literal: true

require "rails_helper"

RSpec.describe PreviousEmploymentPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }
  let(:previous_employment) { create(:previous_employment, user:) }

  context "when user is employed in the current workspace" do
    before do
      create(:employment, company:, user:)
    end

    context "when user is an admin" do
      before do
        user.add_role(:admin, company)
      end

      permissions :index?, :create?, :show?, :update? do
        it "grants permission" do
          expect(described_class).to permit(user, previous_employment)
        end
      end
    end

    context "when user is an owner" do
      before do
        user.add_role(:owner, company)
      end

      permissions :index?, :create?, :show?, :update? do
        it "grants permission" do
          expect(described_class).to permit(user, previous_employment)
        end
      end
    end

    context "when user is an employee" do
      before do
        user.add_role(:employee, company)
      end

      permissions :index?, :create?, :show?, :update? do
        it "grants permission" do
          expect(described_class).to permit(user, previous_employment)
        end
      end
    end
  end

  context "when user is not employed in the current workspace" do
    context "when user is an admin, owner and employee" do
      before do
        user.add_role(:admin, company)
        user.add_role(:owner, company)
        user.add_role(:employee, company)
      end

      permissions :index?, :create?, :show?, :update? do
        it "does not grant permission" do
          expect(described_class).not_to permit(user, previous_employment)
        end
      end
    end
  end
end
