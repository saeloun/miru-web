# frozen_string_literal: true

require "rails_helper"

RSpec.describe PreviousEmploymentPolicy, type: :policy do
  let!(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  # let!(:employment) { create(:employment, company:, user: employee) }
  let(:user_employment) { create(:employment, company:, user:) }
  let(:previous_employment) { create(:previous_employment, user: employee) }

  context "when user is an admin" do
    before do
      user.add_role :admin, company
      employee.add_role :employee, company
      create(:employment, company:, user: employee)
    end

    permissions :update?, :show? do
      it "grants permission to an admin to perform actions of same company and within same company workspace" do
        expect(described_class).to permit(user, previous_employment)
      end
    end
  end

  context "when user is an owner" do
    before do
      user.add_role :owner, company
      employee.add_role :employee, company
      create(:employment, company:, user: employee)
    end

    permissions :update?, :show? do
      it "grants permission to an admin to perform actions of same company and within same company workspace" do
        expect(described_class).to permit(user, previous_employment)
      end
    end
  end

  context "when user is an employee" do
    before do
      user.add_role :employee, company
      create(:employment, company:, user: employee)
    end

    permissions :update?, :show? do
      it "grants permission to an admin to perform actions of same company and within same company workspace" do
        expect(described_class).to permit(user, previous_employment)
      end
    end
  end
end
