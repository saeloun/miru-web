# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Due invoice payment reminder", type: :system do
  let!(:company) { create(:company) }
  let!(:client) { create(:client, company:) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:invoice1) { create(:invoice_with_invoice_line_items, client:, status: "sent") }
  let!(:invoice2) { create(:invoice_with_invoice_line_items, client:, status: "viewed") }
  let!(:invoice3) { create(:invoice_with_invoice_line_items, client:, status: "overdue") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "can view invoice number on payment reminder modal" do
    with_forgery_protection do
      visit "/clients/#{client.id}"

      find("div.relative.h-8").click
      click_button "Payment Reminder"

      expect(page).to have_content(invoice1.invoice_number)
      expect(page).to have_content(invoice2.invoice_number)
      expect(page).to have_content(invoice3.invoice_number)
    end
  end

  it "can view client email and subject on email preview" do
    with_forgery_protection do
      visit "/clients/#{client.id}"

      find("div.relative.h-8").click
      click_button "Payment Reminder"
      click_button "Continue"

      expect(page).to have_content(client.email)
      expect(page).to have_content("Reminder to complete payments for unpaid invoices")
      expect(page).to have_content(invoice3.invoice_number)
    end
  end

  it "can send payment reminder to client" do
    with_forgery_protection do
      visit "/clients/#{client.id}"

      find("div.relative.h-8").click
      click_button "Payment Reminder"
      click_button "Continue"
      click_button "Send Reminder"

      expect(page).to have_content("Payment reminder has been sent to #{client.email}")
    end
  end
end
