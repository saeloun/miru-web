# frozen_string_literal: true

require "rails_helper"

RSpec.describe NavigationHelper, type: :helper do
  describe ".nav_helper" do
    let(:user) { create(:user) }

    before do
      create(:employment, user:)
      user.add_role(:owner, user.current_workspace)
      allow(helper).to receive(:current_user).and_return(user)
    end

    it "returns links with the given styles" do
      style = "test"
      active_style = "active"
      inactive_style = "inactive"

      nav = helper.nav_helper(style:, active_style:, inactive_style:)

      expect(nav).to include("test", "inactive")
      expect(nav).to include("team", "clients", "projects", "invoices", "payments")
      expect(nav).not_to include("reports")
    end
  end
end
