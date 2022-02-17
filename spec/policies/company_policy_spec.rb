# frozen_string_literal: true

require "rails_helper"

RSpec.describe CompanyPolicy, type: :policy do
  let(:user) { User.new }

  subject { described_class }

  context "when user is admin" do
    before do
      user.add_role :admin
    end

    permissions :new?, :create?, :show?, :update? do
      it "is permitted to access company" do
        expect(subject).to permit(user, Company)
      end
    end
  end

  context "when user is employee" do
    before do
      user.add_role :employee
    end

    permissions :new?, :create?, :show?, :update? do
      it "is not permitted to access company" do
        expect(subject).not_to permit(user, Company)
      end
    end
  end
end
