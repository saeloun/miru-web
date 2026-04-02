# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice creation", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Acme Labs") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "saves a new invoice with a manual line item draft" do
    with_forgery_protection do
      visit "/invoices/new?clientId=#{client.id}"

      fill_in "invoiceNumber", with: "INV-MANUAL-001"
      expect(page).to have_button(client.name, wait: 10)

      click_button "LINE ITEMS"

      find("input[placeholder='Enter name']").fill_in with: "Manual item"
      find("input[placeholder='0.00']").fill_in with: "100"
      find("input[placeholder='00:00']").fill_in with: "02:00"
      find("textarea[placeholder='Enter Description']").fill_in with: "Local save check"

      expect(page).to have_text("Manual item", wait: 10)
      expect(page).to have_text("Local save check", wait: 10)

      click_button "Save"

      expect(page).to have_text("Invoice created successfully", wait: 10)

      invoice = Invoice.find_by!(invoice_number: "INV-MANUAL-001")
      line_item = invoice.invoice_line_items.last

      expect(line_item.name).to eq("Manual item")
      expect(line_item.description).to eq("Local save check")
      expect(line_item.quantity).to eq(120)
      expect(line_item.rate).to eq(100)
      expect(line_item.date).to be_present
    end
  end
end
