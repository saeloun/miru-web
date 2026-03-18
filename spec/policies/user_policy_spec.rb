# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:record) { create(:user, current_workspace_id: company.id) }
  let(:other_workspace_user) { create(:user, current_workspace_id: other_company.id) }

  before do
    create(:employment, company:, user:)
    create(:employment, company:, user: record)
    create(:employment, company: other_company, user: other_workspace_user)
  end

  permissions :index? do
    it "permits owner, admin, employee, and book keeper" do
      %i[owner admin employee book_keeper].each do |role|
        user.add_role(role, company)
        expect(described_class).to permit(user, record)
        user.remove_role(role, company)
      end
    end

    it "forbids client" do
      user.add_role(:client, company)
      expect(described_class).not_to permit(user, record)
    end
  end

  permissions :show?, :update? do
    it "permits a user to access themselves" do
      user.add_role(:employee, company)
      expect(described_class).to permit(user, user)
    end

    it "permits owner/admin in the same workspace" do
      %i[owner admin].each do |role|
        user.add_role(role, company)
        expect(described_class).to permit(user, record)
        user.remove_role(role, company)
      end
    end

    it "forbids users from another workspace" do
      user.add_role(:admin, company)
      expect(described_class).not_to permit(user, other_workspace_user)
    end
  end

  permissions :create? do
    it "permits owner/admin in the same workspace" do
      %i[owner admin].each do |role|
        user.add_role(role, company)
        expect(described_class).to permit(user, record)
        user.remove_role(role, company)
      end
    end

    it "forbids employee access" do
      user.add_role(:employee, company)
      expect(described_class).not_to permit(user, record)
    end
  end

  permissions :destroy? do
    it "permits owner/admin in the same workspace for other users" do
      %i[owner admin].each do |role|
        user.add_role(role, company)
        expect(described_class).to permit(user, record)
        user.remove_role(role, company)
      end
    end

    it "forbids destroying self" do
      user.add_role(:owner, company)
      expect(described_class).not_to permit(user, user)
    end

    it "forbids employee access" do
      user.add_role(:employee, company)
      expect(described_class).not_to permit(user, record)
    end
  end
end
