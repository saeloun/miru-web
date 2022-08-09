# frozen_string_literal: true

require "rails_helper"

RSpec.describe AddressPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }
  let(:employee) { create(:user, current_workspace: company) }
  let(:company_address) { create(:address, addressable_type: "Company", addressable_id: company.id) }
  let(:company2_address) { create(:address, addressable_type: "Company", addressable_id: company2.id) }
  let(:employee_address) { create(:address, addressable_type: "User", addressable_id: employee.id) }
  let(:user_address) { create(:address, addressable_type: "User", addressable_id: user.id) }

  context "when logged in user is within the same workspace as the addressable User" do
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
          expect(described_class).to permit(user, employee)
        end
      end

      permissions :show?, :update? do
        it "grants permission for show and update" do
          expect(described_class).to permit(user, employee_address)
        end
      end
    end

    context "when user is an owner" do
      before do
        user.add_role :owner, company
      end

      permissions :index?, :create? do
        it "grants permission for index and create" do
          expect(described_class).to permit(user, employee)
        end
      end

      permissions :show?, :update? do
        it "grants permission for show and update" do
          expect(described_class).to permit(user, employee_address)
        end
      end
    end

    context "when employee is logged in and checks his own record" do
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
          expect(described_class).to permit(user, user_address)
        end
      end
    end
  end

  context "when user is not within the same workspace as the addressable User" do
    context "when user is an admin, owner and employee" do
      before do
        user.add_role(:admin, company)
        user.add_role(:owner, company)
        user.add_role(:employee, company)
        create(:employment, company: company2, user: employee)
        create(:employment, company:, user:)
      end

      permissions :index?, :create? do
        it "does not grant permission for index and create" do
          expect(described_class).not_to permit(user, employee)
        end
      end

      permissions :show?, :update? do
        it "does not grant permission for show and update" do
          expect(described_class).not_to permit(user, employee_address)
        end
      end
    end
  end

  context "when logged in user is within the same workspace as the addressable Company" do
    before do
      create(:employment, company:, user:)
    end

    context "when user is an admin" do
      before do
        user.add_role(:admin, company)
      end

      permissions :index?, :create? do
        it "grants permission for index and create" do
          expect(described_class).to permit(user, company)
        end
      end

      permissions :show?, :update? do
        it "grants permission for show and update" do
          expect(described_class).to permit(user, company_address)
        end
      end
    end

    context "when user is an owner" do
      before do
        user.add_role :owner, company
      end

      permissions :index?, :create? do
        it "grants permission for index and create" do
          expect(described_class).to permit(user, company)
        end
      end

      permissions :show?, :update? do
        it "grants permission for show and update" do
          expect(described_class).to permit(user, company_address)
        end
      end
    end

    context "when employee is logged in and tries to checks his own company record" do
      before do
        user.add_role :employee, company
      end

      permissions :index?, :create? do
        it "does not grants permission for index and create" do
          expect(described_class).not_to permit(user, company)
        end
      end

      permissions :show?, :update? do
        it "does not grants permission for show and update" do
          expect(described_class).not_to permit(user, company_address)
        end
      end
    end
  end

  context "when user is not within the same workspace as the addressable Company" do
    context "when user is an admin, owner and employee" do
      before do
        user.add_role(:admin, company)
        user.add_role(:owner, company)
        user.add_role(:employee, company)
        create(:employment, company: company2, user: employee)
        create(:employment, company:, user:)
      end

      permissions :index?, :create? do
        it "does not grant permission for index and create" do
          expect(described_class).not_to permit(user, employee)
        end
      end

      permissions :show?, :update? do
        it "does not grant permission for show and update" do
          expect(described_class).not_to permit(user, company2_address)
        end
      end
    end
  end
end
