# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompanyPolicy, type: :policy, company_ploicy: true do
  let(:user) { User.new }

  subject { described_class }

  context "Admin" do
    before do
      user.add_role :admin
    end

    permissions :new?, :create?, :show?, :update? do
      it "admin can access company" do
        expect(subject).to permit(user, Company)
      end
    end
  end

  context "Employee" do
    before do
      user.add_role :employee
    end

    permissions :new?, :create?, :show?, :update? do
      it "employee can't access company" do
        expect(subject).not_to permit(user, Company)
      end
    end
  end
end
