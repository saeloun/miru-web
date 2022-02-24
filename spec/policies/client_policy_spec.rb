# frozen_string_literal: true

require "rails_helper"

RSpec.describe ClientPolicy, type: :policy do
  let (:company) { create(:company) }
  let (:user) { create(:user, current_workspace_id: company.id) }
  let (:client) { create(:client, company_id: company.id) }

  subject { described_class }

  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
    end

    permissions :create? do
      it "is permitted to create client" do
        expect(subject).to permit(user, Client)
      end
    end

    permissions :update? do
      it "is permitted to create update" do
        expect(subject).to permit(user, client)
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :employee, company
    end

    permissions :create? do
      it "is not permitted to create client" do
        expect(subject).not_to permit(user, Client)
      end
    end

    permissions :update? do
      it "is not permitted to create update" do
        expect(subject).not_to permit(user, client)
      end
    end
  end
end
