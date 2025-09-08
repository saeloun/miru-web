# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "Send Reminder", type: :system do
  it "is able to send reminder from Invoices List page", :pending do
    with_forgery_protection do
      visit "invoices"

      expect(page).to have_text "Invoices"
      expect(page).to have_content "All Invoices"

      find(:css, "#invoicesListTableRow").hover
      find(:css, "#openMenu").click
      find('button[aria-label*="reminder"], button:has(svg[data-icon="bell"]), .reminder-button', match: :first).click
      click_button("Send Reminder")
      expect(page).to have_content("A reminder has been sent to #{invoice.client.email}")
    end
  end

  it "is able to send reminder from Invoices show page", :pending do
    with_forgery_protection do
      visit "invoices/#{invoice.id}"

      find(:css, "#menuOpen").click
      find('button[aria-label*="reminder"], button:has(svg[data-icon="bell"]), .reminder-button', match: :first).click
      click_button("Send Reminder")
    end
  end
end
