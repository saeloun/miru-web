# frozen_string_literal: true

require "rails_helper"

shared_examples "Send Invoice" do
  it "is able to send invoice from Invoices List page" do
        with_forgery_protection do
          visit "invoices"

          expect(page).to have_text "Invoices"
          expect(page).to have_xpath "//h1[text()='All Invoices']"

          # Verify the page must have the new invoice
          within_table("invoicesListTable") do
            tr = find(:xpath, "//*[@id='invoicesListTable-row'][1]")
            expect(tr).to have_xpath "//h3[text()='#{invoice.invoice_number}']"
            expect(tr).to have_xpath "//span[text()='#{company.name}']"
            tr.hover

            # Send invoice
            find_by_id("sendInvoiceButton", visible: false).click()
            click_button("Send Invoice")
          end
        end
      end

  it "is able to send invoice from Edit Invoice page" do
    with_forgery_protection do
      visit "invoices/#{invoice.id}/edit"

      find_by_id("sendInvoiceButton").click()
      click_button("Send Invoice")
      expect(page).to have_content(/PROCESSING.../, wait: 3)
      # expect(page).to have_content("Invoice will be sent!") - Need to verify.
    end
  end
end
