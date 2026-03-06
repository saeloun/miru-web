# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "View Invoice Logs", type: :system do
  xit "is able to view Invoices logs panel" do
    with_forgery_protection do
      visit "/invoices/#{invoice.id}"
      expect(page).to have_content("Invoice Number")
      expect(page).to have_content("##{invoice.invoice_number}")

      find_by_id("menuOpen").click
      find_by_id("viewHistory").click

      expect(page).to have_content("History")
    end
  end
end
