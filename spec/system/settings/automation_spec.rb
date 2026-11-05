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
      expect(page).to have_css("code", text: "miru login --email you@example.com", exact_text: true)
      expect(page).not_to have_css("code", text: "--password")
      expect(page).to have_content("miru invoice list", wait: 10)
      page.save_screenshot(Rails.root.join("tmp", "automation-english.png"), full: true)
    end
  end

  it "shows localized copy on the automation page" do
    user.update!(locale: "hi")

    with_forgery_protection do
      visit "/settings/automation"

      expect(page).to have_content("ऑटोमेशन और CLI", wait: 10)
      expect(page).to have_content("हर प्लान के लिए निःशुल्क", wait: 10)
      expect(page).to have_content("एक बार प्रमाणित करें", wait: 10)
      expect(page).to have_css("code", text: "miru login --email you@example.com", exact_text: true)
      expect(page).not_to have_css("code", text: "--password")
      page.save_screenshot(Rails.root.join("tmp", "automation-hindi.png"), full: true)
    end
  end
end
