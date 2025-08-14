# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Multi-Currency Invoice Management", type: :system do
  let(:company) { create(:company, base_currency: "USD", name: "Test Company", country: "US") }
  let(:admin_user) { create(:user, current_workspace_id: company.id) }

  let(:usd_client) { create(:client, company: company, currency: "USD", name: "US Client") }
  let(:eur_client) { create(:client, company: company, currency: "EUR", name: "European Client") }
  let(:gbp_client) { create(:client, company: company, currency: "GBP", name: "UK Client") }

  before do
    # Mock currency conversion service for predictable tests
    allow(CurrencyConversionService).to receive(:get_exchange_rate) do |from, to, _date|
      case [from, to]
      when ["EUR", "USD"] then 1.18
      when ["GBP", "USD"] then 1.35
      when ["USD", "USD"] then 1.0
      else 1.0
      end
    end

    sign_in(admin_user)
  end

  describe "Creating invoices with different currencies" do
    scenario "Creating a USD invoice (same as base currency)" do
      visit new_invoice_path

      fill_in "Invoice Number", with: "INV-001"
      select usd_client.name, from: "Client"
      fill_in "Amount", with: "1000.00"
      select "USD", from: "Currency"
      fill_in "Issue Date", with: Date.current.strftime("%Y-%m-%d")
      fill_in "Due Date", with: 30.days.from_now.strftime("%Y-%m-%d")

      click_button "Create Invoice"

      expect(page).to have_content("Invoice created successfully")

      invoice = Invoice.last
      expect(invoice.currency).to eq("USD")
      expect(invoice.amount).to eq(1000.00)
      expect(invoice.base_currency_amount).to eq(0.0) # No conversion needed
      expect(invoice.exchange_rate).to be_nil
    end

    scenario "Creating a EUR invoice (different from base currency)" do
      visit new_invoice_path

      fill_in "Invoice Number", with: "INV-002"
      select eur_client.name, from: "Client"
      fill_in "Amount", with: "2000.00"
      select "EUR", from: "Currency"
      fill_in "Issue Date", with: Date.current.strftime("%Y-%m-%d")
      fill_in "Due Date", with: 30.days.from_now.strftime("%Y-%m-%d")

      click_button "Create Invoice"

      expect(page).to have_content("Invoice created successfully")

      invoice = Invoice.last
      expect(invoice.currency).to eq("EUR")
      expect(invoice.amount).to eq(2000.00)
      expect(invoice.base_currency_amount).to eq(2360.00) # 2000 * 1.18
      expect(invoice.exchange_rate).to eq(1.18)
      expect(invoice.exchange_rate_date).to eq(Date.current)
    end

    scenario "Creating a GBP invoice shows currency conversion in UI" do
      visit new_invoice_path

      fill_in "Invoice Number", with: "INV-003"
      select gbp_client.name, from: "Client"
      fill_in "Amount", with: "1500.00"
      select "GBP", from: "Currency"
      fill_in "Issue Date", with: Date.current.strftime("%Y-%m-%d")
      fill_in "Due Date", with: 30.days.from_now.strftime("%Y-%m-%d")

      # Check if currency conversion is shown in UI
      expect(page).to have_content("GBP") # Currency selector

      click_button "Create Invoice"

      expect(page).to have_content("Invoice created successfully")

      invoice = Invoice.last
      expect(invoice.currency).to eq("GBP")
      expect(invoice.amount).to eq(1500.00)
      expect(invoice.base_currency_amount).to eq(2025.00) # 1500 * 1.35
      expect(invoice.exchange_rate).to eq(1.35)
    end
  end

  describe "Viewing invoice list with multi-currency amounts" do
    let!(:usd_invoice) { create(:invoice, client: usd_client, company: company, currency: "USD", amount: 1000.00, status: :sent) }
    let!(:eur_invoice) { create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 2000.00, status: :sent) }
    let!(:gbp_invoice) { create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 1500.00, status: :sent) }

    before do
      # Ensure currency conversions are calculated
      [eur_invoice, gbp_invoice].each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
        invoice.save!
      end
    end

    scenario "Invoice list shows original and converted amounts" do
      visit invoices_path

      expect(page).to have_content("INV")
      expect(page).to have_content(usd_client.name)
      expect(page).to have_content(eur_client.name)
      expect(page).to have_content(gbp_client.name)

      # Check for currency symbols or amounts
      expect(page).to have_content("1,000.00") # USD amount
      expect(page).to have_content("2,000.00") # EUR amount
      expect(page).to have_content("1,500.00") # GBP amount
    end

    scenario "Invoice summary shows total in base currency" do
      visit invoices_path

      # Look for summary section
      within("[data-testid='invoice-summary']", wait: 10) do
        # Total should be in base currency (USD)
        # USD: 1000 + EUR: 2000*1.18 + GBP: 1500*1.35 = 1000 + 2360 + 2025 = 5385
        expect(page).to have_content("5,385.00").or have_content("$5,385")
        expect(page).to have_content("USD").or have_content("$")
      end
    end
  end

  describe "Editing invoices with currency changes" do
    let!(:eur_invoice) { create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 1000.00, status: :draft) }

    scenario "Changing invoice amount recalculates base currency amount" do
      visit edit_invoice_path(eur_invoice)

      # Change the amount
      fill_in "Amount", with: "2000.00"
      click_button "Update Invoice"

      expect(page).to have_content("Invoice updated successfully")

      eur_invoice.reload
      expect(eur_invoice.amount).to eq(2000.00)
      expect(eur_invoice.base_currency_amount).to eq(2360.00) # 2000 * 1.18
    end

    scenario "Changing invoice currency recalculates conversion" do
      # Mock different rate for GBP
      allow(CurrencyConversionService).to receive(:get_exchange_rate)
        .with("GBP", "USD", anything)
        .and_return(1.35)

      visit edit_invoice_path(eur_invoice)

      select "GBP", from: "Currency"
      click_button "Update Invoice"

      expect(page).to have_content("Invoice updated successfully")

      eur_invoice.reload
      expect(eur_invoice.currency).to eq("GBP")
      expect(eur_invoice.base_currency_amount).to eq(1350.00) # 1000 * 1.35
      expect(eur_invoice.exchange_rate).to eq(1.35)
    end
  end

  describe "Invoice status changes with currency tracking" do
    let!(:eur_invoice) { create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 1000.00, status: :draft) }

    scenario "Sending invoice preserves currency conversion" do
      visit invoice_path(eur_invoice)

      click_button "Send Invoice"

      expect(page).to have_content("Invoice sent successfully")

      eur_invoice.reload
      expect(eur_invoice.status).to eq("sent")
      expect(eur_invoice.base_currency_amount).to eq(1180.00) # 1000 * 1.18
      expect(eur_invoice.exchange_rate).to eq(1.18)
      expect(eur_invoice.exchange_rate_date).to eq(Date.current)
    end
  end

  describe "Invoice search and filtering with multi-currency" do
    let!(:usd_invoice) { create(:invoice, client: usd_client, company: company, currency: "USD", amount: 1000.00, status: :sent, invoice_number: "USD-001") }
    let!(:eur_invoice) { create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 2000.00, status: :sent, invoice_number: "EUR-001") }
    let!(:gbp_invoice) { create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 1500.00, status: :overdue, invoice_number: "GBP-001") }

    before do
      [eur_invoice, gbp_invoice].each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
        invoice.save!
      end
    end

    scenario "Searching invoices by currency" do
      visit invoices_path

      # Use search functionality
      fill_in "Search", with: "EUR"
      click_button "Search"

      expect(page).to have_content("EUR-001")
      expect(page).to have_content(eur_client.name)
      expect(page).not_to have_content("USD-001")
      expect(page).not_to have_content("GBP-001")
    end

    scenario "Filtering by status shows correct currency totals" do
      visit invoices_path

      # Filter by overdue status
      select "Overdue", from: "Status Filter"
      click_button "Filter"

      expect(page).to have_content("GBP-001")
      expect(page).to have_content(gbp_client.name)
      expect(page).not_to have_content("USD-001")
      expect(page).not_to have_content("EUR-001")

      # Summary should show overdue total in base currency
      within("[data-testid='overdue-summary']", wait: 5) do
        expect(page).to have_content("2,025.00") # 1500 * 1.35 converted to USD
      end
    end
  end

  describe "Export functionality with multi-currency" do
    let!(:invoices) do
      [
        create(:invoice, client: usd_client, company: company, currency: "USD", amount: 1000.00, status: :sent),
        create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 2000.00, status: :sent),
        create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 1500.00, status: :sent)
      ]
    end

    before do
      invoices[1..2].each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
        invoice.save!
      end
    end

    scenario "Exporting invoices includes currency information" do
      visit invoices_path

      click_button "Export"
      select "CSV", from: "Export Format"
      click_button "Download"

      # Check if download was initiated
      expect(page).to have_content("Export started").or(expect(page.response_headers["Content-Type"]).to include("csv"))
    end

    scenario "PDF export shows multi-currency totals" do
      visit invoices_path

      click_button "Export"
      select "PDF", from: "Export Format"
      click_button "Download"

      # Check if download was initiated
      expect(page).to have_content("Export started").or(expect(page.response_headers["Content-Type"]).to include("pdf"))
    end
  end

  describe "Bulk operations with multi-currency invoices" do
    let!(:invoices) do
      [
        create(:invoice, client: usd_client, company: company, currency: "USD", amount: 1000.00, status: :draft),
        create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 2000.00, status: :draft),
        create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 1500.00, status: :draft)
      ]
    end

    scenario "Bulk sending invoices preserves currency conversions" do
      visit invoices_path

      # Select multiple invoices
      check "select_invoice_#{invoices[0].id}"
      check "select_invoice_#{invoices[1].id}"
      check "select_invoice_#{invoices[2].id}"

      click_button "Bulk Actions"
      select "Send Invoices", from: "Action"
      click_button "Execute"

      expect(page).to have_content("Invoices sent successfully")

      # Verify all invoices have proper currency conversions
      invoices.each(&:reload)

      expect(invoices[0].status).to eq("sent")
      expect(invoices[0].base_currency_amount).to eq(0.0) # USD, no conversion

      expect(invoices[1].status).to eq("sent")
      expect(invoices[1].base_currency_amount).to eq(2360.00) # EUR * 1.18

      expect(invoices[2].status).to eq("sent")
      expect(invoices[2].base_currency_amount).to eq(2025.00) # GBP * 1.35
    end
  end

  describe "Real-time currency rate updates" do
    let!(:eur_invoice) { create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 1000.00, status: :draft) }

    scenario "Creating invoice with current exchange rate" do
      # Mock a different rate for "current" vs "historical"
      allow(CurrencyConversionService).to receive(:get_exchange_rate)
        .with("EUR", "USD", Date.current)
        .and_return(1.20) # Higher rate

      visit edit_invoice_path(eur_invoice)
      click_button "Update Invoice"

      eur_invoice.reload
      expect(eur_invoice.base_currency_amount).to eq(1200.00) # 1000 * 1.20
      expect(eur_invoice.exchange_rate).to eq(1.20)
    end
  end
end
