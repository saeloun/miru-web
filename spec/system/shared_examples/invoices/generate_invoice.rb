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

  it "opens invoice creation flow" do
    with_forgery_protection do
      visit "invoices"

      expect(page).to have_text "Invoices"

      click_button("Create New Invoice")
      expect(page).to have_text "Generate Invoice"
      expect(page).to have_field("invoiceNumber", wait: 10)
      expect(page).to have_content("BILL TO", wait: 10)
    end
  end
end
