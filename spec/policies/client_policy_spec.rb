# frozen_string_literal: true

require "rails_helper"

RSpec.describe ClientPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }

  subject { described_class }

  context "when user is admin" do
    before do
      create(:company_user, company:, user_id: user.id)
      user.add_role :admin, company
    end

    permissions :create? do
      it "is permitted to create client" do
        expect(subject).to permit(user, Client)
      end
    end

    permissions :update? do
      it "is permitted to update" do
        expect(subject).to permit(user, client)
      end

      it "is not permitted to update client in different company" do
        client.update(company_id: company2.id)
        expect(subject).not_to permit(user, client)
      end
    end

    permissions :destroy? do
      it "is permitted to destroy" do
        expect(subject).to permit(user, client)
      end

      it "is not permitted to destroy client in different company" do
        client.update(company_id: company2.id)
        expect(subject).not_to permit(user, client)
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user_id: user.id)
      user.add_role :employee, company
    end

    permissions :create? do
      it "is not permitted to create client" do
        expect(subject).not_to permit(user, Client)
      end
    end

    permissions :update? do
      it "is not permitted to update" do
        expect(subject).not_to permit(user, client)
      end

      it "is not permitted to update client in different company" do
        client.update(company_id: company2.id)
        expect(subject).not_to permit(user, client)
      end
    end

    permissions :destroy? do
      it "is not permitted to destroy" do
        expect(subject).not_to permit(user, client)
      end

      it "is not permitted to destroy client in different company" do
        client.update(company_id: company2.id)
        expect(subject).not_to permit(user, client)
      end
    end
  end
end
