# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client agreement details", type: :system, js: true do
  let(:company) { create(:company, name: "Miru Agreement QA") }
  let(:user) { create(:user, current_workspace: company) }
  let!(:client) { create(:client, company:, name: "Synthetic Agreement Client", logo: nil) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
    @console_errors = []
    page.driver.browser.on("Runtime.consoleAPICalled") do |event|
      @console_errors << event if event["type"] == "error"
    end
  end

  def open_editor(width)
    if width < 768
      visit "/clients/#{client.id}"
      find("#kebabMenu").click
      find("li", exact_text: "Edit").click
    else
      visit "/clients"
      page.all("button", text: "Open menu").first.click
      find("[role=menuitem]", text: "Edit Client").click
      expect(page).to have_selector("[role=dialog]")
    end
  end

  def capture(filename)
    page.evaluate_async_script(<<~JS)
      const done = arguments[0];
      document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(resolve)))
        .then(() => Promise.all(document.getAnimations()
          .filter(animation => animation.effect?.getTiming().iterations !== Infinity)
          .map(animation => animation.finished.catch(() => {}))))
        .then(() => requestAnimationFrame(() => requestAnimationFrame(done)));
    JS
    page.save_screenshot(Rails.root.join("tmp/capybara/#{filename}"), full: true)
  end

  [1440, 390].each do |width|
    it "saves, reopens and independently updates contacts at #{width}px" do
      page.current_window.resize_to(width, width < 768 ? 844 : 1000)
      save_label = width < 768 ? "Save Changes" : "Save"
      open_editor(width)
      expect(page).to have_field("Legal company name", with: "")
      fill_in "legal_name", with: "Example International Consulting Private Limited"
      fill_in "finance_email", with: "invalid-email"
      expect(page).to have_button(save_label, disabled: true)
      fill_in "finance_email", with: "finance@example.test"
      fill_in "signatory_name", with: "Asha Núñez"
      fill_in "signatory_designation", with: "Head of Legal"
      click_button "Use finance email for signatory"
      expect(page).to have_field("signatory_email", with: "finance@example.test")
      expect(page).to have_button(save_label, disabled: false)
      legend = find("legend", text: "Agreement and billing details")
      page.execute_script("arguments[0].scrollIntoView({ block: 'start', behavior: 'instant' })", legend)
      capture("client-agreement-fields-#{width}.png")
      click_button save_label
      expect(page).to have_no_field("Finance email")
      expect(client.reload.signatory_email).to eq("finance@example.test")

      open_editor(width)
      expect(page).to have_field("legal_name", with: "Example International Consulting Private Limited")
      expect(page).to have_field("signatory_name", with: "Asha Núñez")
      fill_in "finance_email", with: "new-finance@example.test"
      expect(page).to have_field("signatory_email", with: "finance@example.test")
      click_button save_label
      expect(page).to have_no_field("Finance email")
      expect(client.reload.finance_email).to eq("new-finance@example.test")
      expect(client.signatory_email).to eq("finance@example.test")

      visit "/clients/#{client.id}"
      find('button[aria-label="Client Details"]').click
      expect(page).to have_text("Example International Consulting Private Limited")
      expect(page).to have_text("new-finance@example.test")
      expect(page).to have_text("finance@example.test")
      expect(page).to have_text("Asha Núñez")
      expect(page.evaluate_script("document.documentElement.scrollWidth <= innerWidth + 1")).to be(true)
      capture("client-agreement-details-#{width}.png")
      expect(@console_errors).to be_empty
    end
  end
end
