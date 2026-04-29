# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client invoice detail", type: :system, js: true do
  let(:company) { create(:company) }
  let(:client_user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Client Portal Co") }
  let!(:client_member) { create(:client_member, company:, client:, user: client_user) }
  let!(:employment) { create(:employment, company:, user: client_user) }
  let!(:invoice) do
    create(
      :invoice,
      company:,
      client:,
      invoice_number: "CLIENT-001",
      status: "sent"
    )
  end

  before do
    client_user.add_role :client, company
    sign_in(client_user)
  end

  it "lets the client open invoice detail from the invoice list" do
    with_forgery_protection do
      visit "/invoices"

      click_link "View invoice #{invoice.invoice_number}"

      expect(page).to have_current_path("/invoices/#{invoice.external_view_key}", wait: 10)
      expect(page).to have_content("Invoice ##{invoice.invoice_number}", wait: 10)
      expect(page).to have_content(client.name, wait: 10)
    end
  end

  it "shows UPI QR branding and India bank details for INR invoices" do
    company.update!(
      bank_name: "HDFC Bank",
      bank_account_number: "1234567890",
      bank_routing_number: "HDFC0001234"
    )
    client.update!(currency: "INR")
    invoice.update!(
      currency: "INR",
      amount: 1200,
      amount_due: 1200,
      status: "sent"
    )
    create(
      :payments_provider,
      company:,
      name: PaymentsProvider::UPI_PROVIDER,
      enabled: true,
      connected: true,
      settings: {
        upi_id: "saeloun@upi",
        payee_name: "Saeloun",
        enabled_on_invoices: true
      }
    )

    with_forgery_protection do
      visit "/invoices/#{invoice.external_view_key}"

      expect(page).to have_content("Invoice ##{invoice.invoice_number}", wait: 10)
      expect(page).to have_css("img[alt='Miru']", wait: 10)
      expect(page).to have_css("img[alt='UPI QR code']")
      expect(page).to have_content("UPI: saeloun@upi")
      expect(page).to have_content("INDIA BANK DETAILS")
      expect(page).to have_content("HDFC Bank")
      expect(page).to have_content("HDFC0001234")
    end
  end
end
