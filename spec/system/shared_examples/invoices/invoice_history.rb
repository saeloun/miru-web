# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "View Invoice Logs", type: :system do
  it "is able to view Invoices logs panel" do
    with_forgery_protection do
      visit "invoices"

      expect(page).to have_content "Invoices"
      expect(page).to have_content "All Invoices"

      find(:css, "#invoicesListTableRow").click
      expect(page).to have_content("Invoice ##{invoice.invoice_number}")

      find_by_id("menuOpen").click
      find_by_id("viewHistory").click

      expect(page).to have_content("History")
    end
  end
end
