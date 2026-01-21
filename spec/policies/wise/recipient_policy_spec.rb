# frozen_string_literal: true

require "rails_helper"

RSpec.describe Wise::RecipientPolicy, type: :policy, wise: true do
  let(:company) { create(:company) }
  let(:another_company) { create(:company) }

  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  permissions :show?, :create?, :update? do
    context "when user is from same company" do
      it "grants permission to an admin, employee and owner" do
        expect(described_class).to permit(admin, company)
        expect(described_class).to permit(owner, company)
        expect(described_class).to permit(employee, company)
      end
    end

    context "when user is from another company" do
      it "grants permission to an admin, employee and owner" do
        expect(described_class).not_to permit(admin, another_company)
        expect(described_class).not_to permit(owner, another_company)
        expect(described_class).not_to permit(employee, another_company)
      end
    end
  end
end
