# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProfilePolicy, type: :policy do
  let(:user) { create(:user) }

  permissions :update? do
    it "permits an authenticated user" do
      expect(described_class).to permit(user, :profile)
    end
  end
end
