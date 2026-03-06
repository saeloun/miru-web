# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "Edit Invoice", type: :system do
  it "loads invoice list and opens invoice details" do
    with_forgery_protection do
      visit "invoices"
      expect(page).to have_content("Invoices", wait: 10)
      expect(page).to have_content(invoice.invoice_number, wait: 10)

      visit "/invoices/#{invoice.id}"
      expect(page).to have_content("Invoice Number", wait: 10)
      expect(page).to have_content(invoice.invoice_number, wait: 10)
    end
  end
end
