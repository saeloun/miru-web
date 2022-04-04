# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvoicePolicy, type: :policy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  subject { described_class }

  context "when user is admin" do
    before do
      create(:company_user, company:, user_id: user.id)
      user.add_role :admin, company
    end

    permissions :index? do
      it "is permitted to access index" do
        expect(subject).to permit(user, :invoice)
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user_id: user.id)
      user.add_role :employee, company
    end

    permissions :index? do
      it "is not permitted to access index" do
        expect(subject).not_to permit(user, :invoice)
      end
    end
  end
end
