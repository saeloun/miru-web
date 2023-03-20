# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "Edit Invoice", type: :system do
  it "is able to Edit from Invoices list page" do
    with_forgery_protection do
      visit "invoices"

      expect(page).to have_content "Invoices"
      expect(page).to have_xpath "//h1[text()='All Invoices']"

      find(:css, "#invoicesListTableRow").hover
      find_by_id("editInvoiceButton").click
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
      find(:field, id: "invoiceNumber").set("test-invoice-1-updated")

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
