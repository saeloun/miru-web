# frozen_string_literal: true

require "rails_helper"

RSpec.describe ClientPolicy, type: :policy do
  let(:user) { build(:user) }

  subject { described_class }

  context "when user is admin" do
    before do
      user.add_role :admin
    end

    permissions :create? do
      it "is permitted to create client" do
        expect(subject).to permit(user, Client)
      end
    end
  end

  context "when user is employee" do
    before do
      user.add_role :employee
    end

    permissions :create? do
      it "is not permitted to create client" do
        expect(subject).not_to permit(user, Client)
      end
    end
  end
end
