# frozen_string_literal: true

require "rails_helper"

RSpec.describe DashboardPolicy, type: :policy do
  let(:user) { User.new }

  subject { described_class }

  context "Admin" do
    before do
      user.add_role :admin
    end

    permissions :index? do
      it "admin can access index" do
        expect(subject).to permit(user, :dashboard)
      end
    end
  end

  context "Employee" do
    before do
      user.add_role :employee
    end

    permissions :index? do
      it "employee can't access index" do
        expect(subject).not_to permit(user, :dashboard)
      end
    end
  end
end
