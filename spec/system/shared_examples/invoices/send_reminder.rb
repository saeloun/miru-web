# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "Send Reminder", type: :system do
  it "is able to send reminder from Invoices List page" do
    with_forgery_protection do
      visit "/invoices"

      expect(page).to have_text "Invoices"

      find("[data-testid='invoice-actions-trigger-#{invoice.id}']").click
      find("[data-testid='invoice-action-reminder-#{invoice.id}']").click

      expect(page).to have_content("A reminder has been sent", wait: 10)
    end
  end

  it "is able to send reminder from Invoices show page" do
    with_forgery_protection do
      visit "/invoices/#{invoice.id}"

      find("[data-testid='invoice-preview-reminder-action']").click

      expect(page).to have_content("Overdue", wait: 10)
      expect(page).to have_selector("[data-testid='invoice-preview-reminder-action']", wait: 10)
    end
  end
end
