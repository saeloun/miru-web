# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "Send Invoice", type: :system do
  it "is able to send invoice from Invoices List page even when no payment gateway is connected", :pending do
    with_forgery_protection do
      visit "invoices"

      expect(page).to have_text "Invoices"
      expect(page).to have_content "All Invoices"

      find(:css, "#invoicesListTableRow").hover
      find_by_id("sendInvoiceButton").click
      click_button("Send Without Payment Gateway")
      click_button("Send Invoice")
    end
  end

  it "is able to send invoice from Edit Invoice page even when no payment gateway is connected", :pending do
    with_forgery_protection do
      visit "invoices/#{invoice.id}/edit"

      find_by_id("sendInvoiceButton").click()
      click_button("Send Without Payment Gateway")
      click_button("Send Invoice")
      expect(page).to have_content(/PROCESSING.../, wait: 3)
    end
  end
end
