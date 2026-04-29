# frozen_string_literal: true

require "rails_helper"

RSpec.describe PaymentPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:record) { :payment }

  before do
    create(:employment, company:, user:)
  end

  permissions :index?, :show?, :create?, :new? do
    it "permits owner, admin, and book keeper" do
      %i[owner admin book_keeper].each do |role|
        user.add_role(role, company)
        expect(described_class).to permit(user, record)
        user.remove_role(role, company)
      end
    end

    it "forbids employee and client" do
      %i[employee client].each do |role|
        user.add_role(role, company)
        expect(described_class).not_to permit(user, record)
        user.remove_role(role, company)
      end
    end
  end

  permissions :withdraw? do
    it "permits owner and admin" do
      %i[owner admin].each do |role|
        user.add_role(role, company)
        expect(described_class).to permit(user, record)
        user.remove_role(role, company)
      end
    end

    it "forbids book keeper, employee, and client" do
      %i[book_keeper employee client].each do |role|
        user.add_role(role, company)
        expect(described_class).not_to permit(user, record)
        user.remove_role(role, company)
      end
    end
  end
end
