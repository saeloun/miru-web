# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Settings automation", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :owner, company
    sign_in(user)
  end

  it "shows the Miru CLI commands on the dedicated automation page" do
    with_forgery_protection do
      visit "/settings/automation"

      expect(page).to have_content("Automation and CLI", wait: 10)
      expect(page).to have_content("Free for every plan", wait: 10)
      expect(page).to have_content("miru login --email you@example.com --password password", wait: 10)
      expect(page).to have_content("miru invoice list", wait: 10)
    end
  end
end
