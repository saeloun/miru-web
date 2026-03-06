# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "View Invoice Logs", type: :system do
  it "shows invoice detail page with invoice metadata" do
    with_forgery_protection do
      visit "/invoices/#{invoice.id}"
      expect(page).to have_content("Invoice Number")
      expect(page).to have_content("##{invoice.invoice_number}")
    end
  end
end
