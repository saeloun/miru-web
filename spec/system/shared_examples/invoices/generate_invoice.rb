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

  it "is able to generates Invoice successfully for an employee of his organisation", pending: "Complex React Select components need debugging for invoice line items" do
    with_forgery_protection do
      visit "invoices"

      expect(page).to have_text "Invoices"

      click_button("Create New Invoice")
      find("#BilledTo").click
      # Click on the select trigger to open the dropdown
      find("#clientSelect").click
      # Wait for and click the first option in the shadcn Select dropdown
      find("[role='option']", match: :first, wait: 2).click

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
