# frozen_string_literal: true

require "rails_helper"

RSpec.describe Users::PreviousEmploymentPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }
  let(:employee) { create(:user, current_workspace: company) }
  let(:employee2) { create(:user, current_workspace: company2) }
  let(:previous_employment_user) { create(:previous_employment, user:) }
  let(:previous_employment_employee) { create(:previous_employment, user: employee) }
  let(:previous_employment_employee2) { create(:previous_employment, user: employee2) }

  context "when user is within the same workspace as the previous_employment user" do
    before do
      create(:employment, company:, user: employee)
      create(:employment, company:, user:)
    end

    context "when user is an admin and checks his own record" do
      before do
        user.add_role(:admin, company)
      end

      permissions :index?, :create? do
        it "grants permission for index and create" do
          expect(described_class).to permit(user, user)
        end
      end

      permissions :show?, :update? do
        it "grants permission for show and update" do
          expect(described_class).to permit(user, previous_employment_user)
        end
      end
    end

    context "when user is an owner and checks his own record" do
      before do
        user.add_role :owner, company
      end

      permissions :index?, :create? do
        it "grants permission for index and create" do
          expect(described_class).to permit(user, user)
        end
      end

      permissions :show?, :update? do
        it "grants permission for show and update" do
          expect(described_class).to permit(user, previous_employment_user)
        end
      end
    end

    context "when user is employee and checks his own record" do
      before do
        user.add_role :employee, company
      end

      permissions :index?, :create? do
        it "grants permission for index and create" do
          expect(described_class).to permit(user, user)
        end
      end

      permissions :show?, :update? do
        it "grants permission for show and update" do
          expect(described_class).to permit(user, previous_employment_user)
        end
      end
    end

    context "when user is employee and checks someone else's record" do
      before do
        user.add_role :employee, company
        employee.add_role :employee, company
      end

      permissions :index?, :create? do
        it "does not grant permission for index and create" do
          expect(described_class).not_to permit(user, employee)
        end
      end

      permissions :show?, :update? do
        it "does not grant permission for show and update" do
          expect(described_class).not_to permit(user, previous_employment_employee)
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
        create(:employment, company: company2, user: employee2)
      end

      permissions :index?, :create? do
        it "does not grant permission for index and create" do
          expect(described_class).not_to permit(user, employee)
        end
      end

      permissions :show?, :update? do
        it "does not grant permission for show and update" do
          expect(described_class).not_to permit(user, previous_employment_employee2)
        end
      end
    end
  end
end
