# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompanyPolicy, type: :policy do
  let (:company) { create(:company) }
  let (:user) { create(:user, current_workspace_id: company.id) }

  subject { described_class }

  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
    end

    permissions :new?, :create?, :show?, :update? do
      it "is permitted to access company" do
        expect(subject).to permit(user, company)
      end
    end

    permissions :company_present? do
      it "is permitted to access app" do
        expect(subject).to permit(user, company)
      end

      it "is not permitted to access app when current workspace is not present" do
        user.update(current_workspace_id: nil)

        expect(subject).not_to permit(user, nil)
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :employee, company
    end

    permissions :show?, :update? do
      it "is not permitted to access company" do
        expect(subject).not_to permit(user, company)
      end
    end

    permissions :new?, :create? do
      it "is permitted to access company" do
        expect(subject).to permit(user, company)
      end
    end

    permissions :company_present? do
      it "is permitted to access app" do
        expect(subject).to permit(user, company)
      end

      it "is not permitted to access app when current workspace is not present" do
        user.update(current_workspace_id: nil)

        expect(subject).not_to permit(user, nil)
      end
    end
  end
end
