# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvitationPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:record) { build(:invitation, company_id: company.id, sender_id: user.id) }

  before do
    create(:employment, company:, user:)
  end

  permissions :create?, :edit?, :update?, :destroy?, :resend? do
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
