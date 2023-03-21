# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "Edit Invoice", type: :system do
  it "is able to Edit from Invoices list page" do
    with_forgery_protection do
      visit "invoices"

      expect(page).to have_content "Invoices"
      expect(page).to have_content "All Invoices"

      find(:css, "#invoicesListTableRow").hover
      find_by_id("editInvoiceButton").click

      expect(page).to have_content("Edit Invoice ##{invoice.invoice_number}")
    end
  end

  it "is able to Remove line items" do
    with_forgery_protection do
      visit "invoices/#{invoice.id}/edit"

      expect(page).to have_content "Edit Invoice ##{invoice.invoice_number}"

      page.all(:id, "deleteLineItemButton").each do |el|
        el.click()
      end
      click_on "SAVE"

      expect(page).to have_current_path("/invoices/#{invoice.id}")
      expect(page).to have_no_content "CANCEL"
      expect(page).to have_no_content "+ NEW LINE ITEM"
    end
  end

  it "is able to View all labels" do
    with_forgery_protection do
      visit "invoices/#{invoice.id}/edit"

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

      click_on "CANCEL"

      expect(page).to have_current_path("/invoices/#{invoice.id}")
      expect(page).to have_no_content "CANCEL"
      expect(page).to have_no_content "+ NEW LINE ITEM"
    end
  end

  it "is able to Save changes from Edit invoice" do
    with_forgery_protection do
      visit "invoices/#{invoice.id}/edit"

      find(:field, id: "invoiceNumber").set("test-invoice-1-updated")

      click_on "SAVE"

      expect(page).to have_current_path("/invoices/#{invoice.id}")
      expect(page).to have_no_content "CANCEL"
      expect(page).to have_no_content "+ NEW LINE ITEM"

      expect(page).to have_content "test-invoice-1-updated"
      expect(page).to have_content "Invoice #test-invoice-1-updated"
    end
  end
end
