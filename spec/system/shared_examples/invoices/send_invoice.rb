# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "Send Invoice", type: :system do
  it "is able to send invoice from Invoices List page even when no payment gateway is connected" do
    with_forgery_protection do
      ActionMailer::Base.deliveries.clear
      visit "/invoices"

      expect(page).to have_text "Invoices"

      find("[data-testid='invoice-actions-trigger-#{invoice.id}']").click
      find("[data-testid='invoice-action-send-#{invoice.id}']").click
      find("[data-testid='invoice-recipient-input']").send_keys("ops@example.com", :enter)

      expect(page).to have_content("ops@example.com")

      perform_enqueued_jobs do
        click_button "Send Invoice"
        expect(page).to have_content("Invoice has been sent successfully", wait: 10)
      end

      expect(ActionMailer::Base.deliveries.last.to).to include("ops@example.com")
      expect(page).to have_content("Invoice has been sent successfully", wait: 10)
      expect(page).to have_content("Sent", wait: 10)
    end
  end

  it "is able to send invoice from invoice details page even when no payment gateway is connected" do
    with_forgery_protection do
      ActionMailer::Base.deliveries.clear
      visit "/invoices/#{invoice.id}"

      find("[data-testid='invoice-preview-send-action']").click
      find("[data-testid='invoice-recipient-input']").send_keys("finance@example.com", :enter)

      expect(page).to have_content("finance@example.com")

      perform_enqueued_jobs do
        click_button "Send Invoice"
        expect(page).to have_content("Invoice has been sent successfully", wait: 10)
      end

      expect(ActionMailer::Base.deliveries.last.to).to include("finance@example.com")
      expect(page).to have_content("Invoice has been sent successfully", wait: 10)
    end
  end
end
