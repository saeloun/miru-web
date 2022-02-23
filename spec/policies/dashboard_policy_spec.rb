# frozen_string_literal: true

require "rails_helper"

RSpec.describe DashboardPolicy, type: :policy do
  let(:user) { build(:user) }

  subject { described_class }

  context "when user is admin" do
    before do
      user.add_role :admin
    end

    permissions :index? do
      it "is permitted to access index" do
        expect(subject).to permit(user, :dashboard)
      end
    end
  end

  context "when user is employee" do
    before do
      user.add_role :employee
    end

    permissions :index? do
      it "is not permitted to access index" do
        expect(subject).not_to permit(user, :dashboard)
      end
    end
  end
end
