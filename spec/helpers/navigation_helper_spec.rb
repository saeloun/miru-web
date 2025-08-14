# frozen_string_literal: true

require "rails_helper"

RSpec.describe NavigationHelper, type: :helper do
  describe ".nav_helper" do
    let(:user) { create(:user) }

    before do
      create(:employment, user:)
      user.add_role(:owner, user.current_workspace)
      allow(controller).to receive(:current_user).and_return(user)
    end

    it "returns links with the given styles" do
      %w[team clients projects reports invoices payments]
      style = "test"
      active_style = "active"
      inactive_style = "inactive"

      expect(helper.nav_helper(style:, active_style:, inactive_style:)).to include("test", "inactive")
      expect(helper.nav_helper(style:, active_style:, inactive_style:))
        .to include("team", "clients", "projects", "reports", "invoices")
    end
  end
end
