# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Dashboard workspace switcher", type: :system, js: true do
  let(:primary_company) { create(:company, name: "Primary Workspace") }
  let(:secondary_company) { create(:company, name: "Secondary Workspace") }
  let(:user) do
    create(
      :user,
      current_workspace_id: primary_company.id,
      first_name: "Vipul",
      last_name: "Switcher"
    )
  end

  before do
    create(:employment, company: primary_company, user:)
    create(:employment, company: secondary_company, user:)
    user.add_role :owner, primary_company
    user.add_role :owner, secondary_company
    sign_in(user)
  end

  it "allows switching to another workspace from the sidebar user section" do
    with_forgery_protection do
      visit "/dashboard"

      expect(page).to have_current_path("/dashboard", wait: 10)
      expect(page).to have_content("Primary Workspace", wait: 10)

      find("aside button", text: /Vipul Switcher/, wait: 10).click

      expect(page).to have_content("Switch workspace", wait: 10)
      click_button "Secondary Workspace"

      expect(page).to have_current_path("/dashboard", wait: 10)
      expect(page).to have_content("Secondary Workspace", wait: 10)
      expect(user.reload.current_workspace_id).to eq(secondary_company.id)
    end
  end
end
