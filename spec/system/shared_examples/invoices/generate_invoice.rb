# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "Generate Invoice", type: :system do
  it "is able to view generate invoice page elements" do
    with_forgery_protection do
      visit "invoices"

      expect(page).to have_text "Invoices"

      click_button("Create New Invoice")

      expect(page).to have_text "Generate Invoice"
      expect(page).to have_text company.name
      expect(page).to have_text company.business_phone
    end
  end

  it "is able to generates Invoice successfully for an employee of his organisation" do
    with_forgery_protection do
      visit "invoices"

      expect(page).to have_text "Invoices"

      click_button("Create New Invoice")
      find("#BilledTo").click
      find("div#react-select-2-option-0").click

      find(:field, id: "invoiceNumber").set("test-invoice-1")
      click_button("+ NEW LINE ITEM")
      find(:field, placeholder: "Name").click()
      find(:xpath, "//*[@id='entriesList']/span[contains(text(), '#{employee.first_name}')]").click()
      click_button("SAVE")

      # Verify closing edit window and loading invoice lists page with the same invoice number
      expect(page).to have_current_path "/invoices?invoices_per_page=20&page=1"
      expect(page).to have_xpath "//h1[text()='All Invoices']"
      expect(page).to have_xpath "//h3[text()='test-invoice-1']"
    end
  end
end
