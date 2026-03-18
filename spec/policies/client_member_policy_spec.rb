# frozen_string_literal: true

require "rails_helper"

RSpec.describe ClientMemberPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:client) { create(:client, company:) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:other_company) { create(:company) }
  let(:other_client) { create(:client, company: other_company) }

  before do
    create(:employment, company:, user:)
  end

  permissions :index?, :update?, :destroy? do
    it "permits owner and admin in the same workspace" do
      %i[owner admin].each do |role|
        user.add_role(role, company)
        expect(described_class).to permit(user, client)
        user.remove_role(role, company)
      end
    end

    it "forbids employee, book keeper, and client" do
      %i[employee book_keeper client].each do |role|
        user.add_role(role, company)
        expect(described_class).not_to permit(user, client)
        user.remove_role(role, company)
      end
    end

    it "forbids records from another workspace" do
      user.add_role(:owner, company)
      expect(described_class).not_to permit(user, other_client)
    end
  end
end
