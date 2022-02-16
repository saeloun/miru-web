# frozen_string_literal: true

require "rails_helper"

RSpec.describe TeamPolicy, type: :policy, test_ploi: true do
  let(:user) { User.new() }

  subject { described_class }

  context "Admin" do
    before do
      user.add_role :admin
    end

    permissions :edit?, :update?, :destroy? do
      it "admin can access team" do
        expect(subject).to permit(user, :team)
      end
    end
  end

  context "Employee" do
    before do
      user.add_role :employee
    end

    permissions :edit?, :update?, :destroy? do
      it "employee can't access team" do
        expect(subject).not_to permit(user, :team)
      end
    end
  end
end
