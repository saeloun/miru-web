# frozen_string_literal: true

require "rails_helper"

RSpec.describe CurrentCompanyPolicy, type: :policy do
  let (:company) { create(:company) }
  let (:user) { create(:user, company_id: company.id) }

  subject { described_class }

  context "when user is admin" do
    before do
      user.add_role :admin
    end

    permissions :company_present? do
      it "is permitted to access app" do
        current_company_context = CurrentCompanyContext.new(user, company)
        expect(subject).to permit(user, current_company_context)
      end
    end
  end

  context "when user is employee" do
    before do
      user.add_role :employee
    end

    permissions :company_present? do
      it "is not permitted to access app" do
        current_company_context = CurrentCompanyContext.new(user, company)
        expect(subject).to permit(user, current_company_context)
      end
    end
  end
end
