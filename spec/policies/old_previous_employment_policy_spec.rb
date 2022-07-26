# frozen_string_literal: true

require "rails_helper"

RSpec.describe PreviousEmploymentPolicy, type: :policy do
  let!(:company) { create(:company) }
  let!(:company2) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:admin2) { create(:user, current_workspace_id: company2.id) }
  let(:owner2) { create(:user, current_workspace_id: company2.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:employee2) { create(:user, current_workspace_id: company.id) }
  # let!(:employment) { create(:employment, company:, user: employee) }
  let!(:previous_employment) { create(:previous_employment, user: employee) }

  permissions :update?, :show? do
    it "grants PreviousEmployment#show & update permission
      to an admin and owner within same company workspace" do
      admin.add_role :admin, company
      owner.add_role :owner, company
      create(:employment, company:, user: employee)
      expect(described_class).to permit(admin, previous_employment)
      expect(described_class).to permit(owner, previous_employment)
    end

    it "does not grant PreviousEmployment#show & update permission
      to an admin and owner of a different company" do
      admin2.add_role :admin, company2
      owner2.add_role :owner, company2
      expect(described_class).not_to permit(admin2, previous_employment)
      expect(described_class).not_to permit(owner2, previous_employment)
    end

    it "grants PreviousEmployment#show & update permission to logged in user for his own record" do
      employee.add_role :employee, company
      expect(described_class).to permit(employee, previous_employment)
    end

    it "does not grant PreviousEmployment#show & update permission to
      logged in user for his someone else's record" do
      employee.add_role :employee, company
      employee2.add_role :employee, company
      expect(described_class).not_to permit(employee2, previous_employment)
    end
  end

  permissions :create? do
    it "grants PreviousEmployment#create permission to an admin and owner within same company workspace" do
      admin.add_role :admin, company
      owner.add_role :owner, company
      expect(described_class).to permit(admin, previous_employment)
      expect(described_class).to permit(owner, previous_employment)
    end

    it "grants PreviousEmployment#create permission to employee to create his own record" do
      employee.add_role :employee, company
      expect(described_class).to permit(employee, previous_employment)
    end

    it "does not grant PreviousEmployment#create permission to an admin and owner of a different company" do
      admin2.add_role :admin, company2
      owner2.add_role :owner, company2
      expect(described_class).not_to permit(admin2, previous_employment)
      expect(described_class).not_to permit(owner2, previous_employment)
    end
  end
end
