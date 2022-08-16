# frozen_string_literal: true

require "rails_helper"

RSpec.describe Users::DevicePolicy, type: :policy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }
  let(:employee) { create(:user, current_workspace: company) }
  let(:device) { create(:device, user_id: employee.id, company_id: company.id) }

  context "when user is within the same workspace as the devices user" do
    before do
      create(:employment, company:, user: employee)
      create(:employment, company:, user:)
    end

    context "when user is an admin" do
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
          expect(described_class).to permit(user, device)
        end
      end
    end

    context "when user is an owner" do
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
          expect(described_class).to permit(user, device)
        end
      end
    end

    context "when employee is logged in and checks his own record" do
      before do
        employee.add_role :employee, company
      end

      permissions :index?, :create? do
        it "grants permission for index and create" do
          expect(described_class).to permit(employee, employee)
        end
      end

      permissions :show?, :update? do
        it "grants permission for show and update" do
          expect(described_class).to permit(employee, device)
        end
      end
    end
  end

  context "when user is not within the same workspace as the devices user" do
    context "when user is an admin, owner and employee" do
      before do
        user.add_role(:admin, company)
        user.add_role(:owner, company)
        user.add_role(:employee, company)
      end

      permissions :show?, :update? do
        it "does not grant permission for show and update" do
          expect(described_class).not_to permit(user, device)
        end
      end
    end
  end
end
