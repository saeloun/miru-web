# frozen_string_literal: true

require "rails_helper"

RSpec.describe DashboardPolicy, type: :policy do
  permissions :index? do
    it "permits an authenticated user" do
      expect(described_class).to permit(create(:user), :dashboard)
    end
  end
end
