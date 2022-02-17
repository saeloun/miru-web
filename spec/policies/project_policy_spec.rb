# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProjectPolicy, type: :policy do
  let(:user) { User.new }

  subject { described_class }

  context "when user is admin" do
    before do
      user.add_role :admin
    end

    permissions :create? do
      it "is permitted to create project" do
        expect(subject).to permit(user, Project)
      end
    end
  end

  context "when user is employee" do
    before do
      user.add_role :employee
    end

    permissions :create? do
      it "is not permitted to create project" do
        expect(subject).not_to permit(user, Project)
      end
    end
  end
end
