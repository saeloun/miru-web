# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "Edit Invoice", type: :system do
  it "is able to Edit from Invoices list page", :pending do
    with_forgery_protection do
      visit "invoices"
      click_link "Invoices"
      sleep 2

      expect(page).to have_content "Invoices"
      expect(page).to have_content "All Invoices"

      # Close payment gateway modal if it appears
      if page.has_content?("No payment gateway connected", wait: 2)
        click_button "Send Without Payment Gateway"
        sleep 1
      end

      # Find the invoice row and hover/click edit
      invoice_row = find(:xpath, "//tr[contains(., '#{invoice.invoice_number}')]", match: :first)
      invoice_row.hover
      within(invoice_row) do
        find('button[aria-label*="edit"], button:has(svg), .edit-button', match: :first).click
      end

      expect(page).to have_content("Edit Invoice ##{invoice.invoice_number}")
    end
  end

  it "is able to Remove line items", pending: "Complex React invoice editing components need debugging" do
    with_forgery_protection do
      visit "invoices/#{invoice.id}/edit"
      click_link "Invoices"
      sleep 2

      expect(page).to have_content "Edit Invoice ##{invoice.invoice_number}"

      # Find all delete line item buttons and click them
      delete_buttons = all('button[aria-label*="delete"], button:has(svg[data-icon="trash"]), .delete-line-item')
      delete_buttons.each(&:click)
      click_button "Save", match: :first

      expect(page).to have_current_path("/invoices/#{invoice.id}")
      expect(page).to have_no_content "CANCEL"
      expect(page).to have_no_content "+ NEW LINE ITEM"
    end
  end

  it "is able to View all labels", :pending do
    with_forgery_protection do
      visit "invoices/#{invoice.id}/edit"
      click_link "Invoices"
      sleep 2

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

  it "is able to Cancel Edit", pending: "Complex React invoice editing components need debugging" do
    with_forgery_protection do
      visit "invoices/#{invoice.id}/edit"
      click_link "Invoices"
      sleep 2

      click_button "Cancel", match: :first

      expect(page).to have_current_path("/invoices/#{invoice.id}")
      expect(page).to have_no_content "CANCEL"
      expect(page).to have_no_content "+ NEW LINE ITEM"
    end
  end

  it "is able to Save changes from Edit invoice", pending: "Complex React invoice editing components need debugging" do
    with_forgery_protection do
      visit "invoices/#{invoice.id}/edit"
      click_link "Invoices"
      sleep 2

      find('input[name*="invoice_number"], input[placeholder*="Invoice"]', match: :first).set("test-invoice-1-updated")

      click_button "Save", match: :first

      expect(page).to have_current_path("/invoices/#{invoice.id}")
      expect(page).to have_no_content "CANCEL"
      expect(page).to have_no_content "+ NEW LINE ITEM"

      expect(page).to have_content "test-invoice-1-updated"
      expect(page).to have_content "Invoice #test-invoice-1-updated"
    end
  end
end
