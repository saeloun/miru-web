# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client details", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company, locale: "hi") }
  let(:client) do
    create(
      :client,
      company:,
      name: "Hindi Detail Client",
      phone: "+91 9876543210"
    )
  end

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "shows localized client details actions in Hindi" do
    with_forgery_protection do
      visit "/clients/#{client.id}"

      expect(page).to have_current_path("/clients/#{client.id}", wait: 10)
      expect(page).to have_content("Hindi Detail Client", wait: 10)

      find("#kebabMenu").click

      expect(page).to have_content("प्रोजेक्ट जोड़ें", wait: 10)
      expect(page).to have_content("भुगतान अनुस्मारक", wait: 10)
      expect(page).to have_content("संपर्क जोड़ें / देखें", wait: 10)
      expect(page).to have_content("संपादित करें", wait: 10)
      expect(page).to have_content("हटाएं", wait: 10)

      find("button[aria-label='क्लाइंट विवरण']", wait: 10).click
      expect(page).to have_content("क्लाइंट विवरण", wait: 10)
      expect(page).to have_content("पता", wait: 10)
      expect(page).to have_content("फ़ोन नंबर", wait: 10)
    end
  end
end
