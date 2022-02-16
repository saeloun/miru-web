# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectPolicy, type: :policy do
  let(:user) { User.new }

  subject { described_class }

  context "Admin" do
    before do
      user.add_role :admin
    end

    permissions :create? do
      it "admin can create" do
        expect(subject).to permit(user, Project)
      end
    end
  end

  context "Employee" do
    before do
      user.add_role :employee
    end

    permissions :create? do
      it "employee can't create" do
        expect(subject).not_to permit(user, Project)
      end
    end
  end
end
