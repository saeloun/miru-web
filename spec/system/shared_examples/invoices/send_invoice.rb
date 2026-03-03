# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "Send Invoice", type: :system do
  it "is able to send invoice from Invoices List page even when no payment gateway is connected" do
    with_forgery_protection do
      visit "/invoices"

      expect(page).to have_text "Invoices"

      find("[data-testid='invoice-actions-trigger-#{invoice.id}']").click
      find("[data-testid='invoice-action-send-#{invoice.id}']").click

      expect(page).to have_content("Invoice has been sent successfully", wait: 10)
      expect(page).to have_content("Sent", wait: 10)
    end
  end

  it "is able to send invoice from invoice details page even when no payment gateway is connected" do
    with_forgery_protection do
      visit "/invoices/#{invoice.id}"

      find("[data-testid='invoice-preview-send-action']").click

      expect(page).to have_content("Invoice has been sent successfully", wait: 10)
    end
  end
end
