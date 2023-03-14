# frozen_string_literal: true

require "rails_helper"

shared_examples "Edit Invoice" do
  it "is able to Edit from Invoices list page" do
        with_forgery_protection do
            visit "invoices"

            expect(page).to have_content "Invoices"
            expect(page).to have_xpath "//h1[text()='All Invoices']"

            # Verify the page must have the invoice
            within_table("invoicesListTable") do
              tr = find(:xpath, "//*[@id='invoicesListTable-row'][1]")
              expect(tr).to have_xpath "//h3[text()='#{invoice.invoice_number}']"
              expect(tr).to have_xpath "//span[text()='#{company.name}']"
              tr.hover
            end

            # Edit invoice
            find_by_id("editInvoiceButton", visible: false).click()
            expect(page).to have_css("h2", text: "Edit Invoice ##{invoice.invoice_number}")
          end
      end

  it "is able to Remove line items" do
   with_forgery_protection do
       visit "invoices/#{invoice.id}/edit"

       # Edit invoice
       expect(page).to have_content "Edit Invoice ##{invoice.invoice_number}"

       # Remove all line Items
       page.all(:id, "deleteLineItemButton").each do |el|
         el.click()
       end

       # Verify Save Button
       find_by_id("saveInvoiceButton").click()

       # Should display invoice in view mode
       expect(page).to have_current_path("/invoices/#{invoice.id}")
       expect(page).to have_no_content "CANCEL"
       expect(page).to have_no_content "+ NEW LINE ITEM"
     end
 end

  it "is able to View all labels" do
    with_forgery_protection do
      visit "invoices/#{invoice.id}/edit"

      # Verify Labels
      expect(page).to have_content "Billed to"
      expect(page).to have_content "Invoice Number"
      expect(page).to have_content "Date of Issue"
      expect(page).to have_content "Amount"
      expect(page).to have_content "LINE TOTAL"
      expect(page).to have_content "Tax"
      expect(page).to have_content "Amount Due"
      expect(page).to have_content "Amount Paid"
    end
  end

  it "is able to View all invoice Values" do
   with_forgery_protection do
     visit "invoices/#{invoice.id}/edit"

     # Verify invoice values
     expect(page).to have_css("h2", text: "Edit Invoice ##{invoice.invoice_number}")
     expect(page).to have_content company.name # TODO:- Check why is it failing.
     expect(page).to have_content company.business_phone
     expect(page).to have_content invoice.invoice_number
     expect(page).to have_content invoice.reference
     expect(page).to have_content company.address
   end
 end

  it "is able to Cancel Edit" do
    with_forgery_protection do
      visit "invoices/#{invoice.id}/edit"

      # Verify Cancel Button
      find_by_id("cancelEditInvoiceButton").click()

      # Should display invoice in view mode
      expect(page).to have_current_path("/invoices/#{invoice.id}")
      expect(page).to have_no_content "CANCEL"
      expect(page).to have_no_content "+ NEW LINE ITEM"
    end
  end

  it "is able to Save changes from Edit invoice" do
      with_forgery_protection do
        visit "invoices/#{invoice.id}/edit"

        # Update invoice number
        find(:field, placeholder: "Enter invoice number").set("test-invoice-1-updated")

        # Verify Save Button
        find_by_id("saveInvoiceButton").click()

        # Should display invoice in view mode
        expect(page).to have_current_path("/invoices/#{invoice.id}")
        expect(page).to have_no_content "CANCEL"
        expect(page).to have_no_content "+ NEW LINE ITEM"

        # Should have the updated invoice number
        expect(page).to have_content "test-invoice-1-updated"
        expect(page).to have_content "Invoice #test-invoice-1-updated"
      end
    end
end
