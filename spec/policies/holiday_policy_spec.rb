# frozen_string_literal: true

require "rails_helper"

RSpec.describe HolidayPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:record) { create(:holiday, company:) }

  before do
    create(:employment, company:, user:)
  end

  permissions :index? do
    it "permits owner, admin, and employee" do
      %i[owner admin employee].each do |role|
        user.add_role(role, company)
        expect(described_class).to permit(user, record)
        user.remove_role(role, company)
      end
    end

    it "forbids book keeper and client" do
      %i[book_keeper client].each do |role|
        user.add_role(role, company)
        expect(described_class).not_to permit(user, record)
        user.remove_role(role, company)
      end
    end
  end

  permissions :update? do
    it "permits owner and admin" do
      %i[owner admin].each do |role|
        user.add_role(role, company)
        expect(described_class).to permit(user, record)
        user.remove_role(role, company)
      end
    end

    it "forbids employee, book keeper, and client" do
      %i[employee book_keeper client].each do |role|
        user.add_role(role, company)
        expect(described_class).not_to permit(user, record)
        user.remove_role(role, company)
      end
    end
  end
end
