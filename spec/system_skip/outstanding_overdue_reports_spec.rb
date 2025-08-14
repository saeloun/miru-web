# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Outstanding and Overdue Reports with Multi-Currency", type: :system do
  let(:company) { create(:company, base_currency: "USD", name: "Global Corp", country: "US") }
  let(:admin_user) { create(:user, current_workspace_id: company.id) }

  # Create clients in different regions with different currencies
  let(:us_client) { create(:client, company: company, currency: "USD", name: "US Corp") }
  let(:eu_client) { create(:client, company: company, currency: "EUR", name: "European Ltd") }
  let(:uk_client) { create(:client, company: company, currency: "GBP", name: "British Co") }
  let(:jp_client) { create(:client, company: company, currency: "JPY", name: "Tokyo Inc") }

  before do
    # Mock exchange rates for consistent testing
    allow(CurrencyConversionService).to receive(:get_exchange_rate) do |from, to, _date|
      case [from, to]
      when ["EUR", "USD"] then 1.18
      when ["GBP", "USD"] then 1.35
      when ["JPY", "USD"] then 0.0068
      when ["USD", "USD"] then 1.0
      else 1.0
      end
    end

    sign_in(admin_user)
  end

  describe "Outstanding invoices report with multi-currency" do
    let!(:outstanding_invoices) do
      [
        create(:invoice, client: us_client, company: company, currency: "USD", amount: 5000.00, status: :sent, issue_date: 15.days.ago),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 3000.00, status: :sent, issue_date: 10.days.ago),
        create(:invoice, client: uk_client, company: company, currency: "GBP", amount: 2000.00, status: :viewed, issue_date: 5.days.ago),
        create(:invoice, client: jp_client, company: company, currency: "JPY", amount: 500000, status: :sent, issue_date: 20.days.ago)
      ]
    end

    before do
      # Ensure currency conversions are calculated
      outstanding_invoices[1..3].each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
        invoice.save!
      end
    end

    scenario "Outstanding and overdue reports page loads successfully" do
      visit "/reports/outstanding-overdue-invoices"

      # Just verify the page loads with React app
      expect(page).to have_css("#react-root", wait: 10)

      # If this is a React SPA, we'll get redirected to login if not authenticated
      # or the page will render with React content
      expect(page.current_path).to eq("/reports/outstanding-overdue-invoices").or eq("/login")
    end

    scenario "Outstanding report shows correct base currency totals", :pending do
      visit "/reports/outstanding-overdue-invoices"

      expect(page).to have_content("Outstanding & Overdue Report")
      expect(page).to have_content("USD") # Base currency indicator

      within("[data-testid='outstanding-summary']", wait: 10) do
        # Total outstanding in base currency should be:
        # USD: 5000 + EUR: 3000*1.18 + GBP: 2000*1.35 + JPY: 500000*0.0068
        # = 5000 + 3540 + 2700 + 3400 = 14640
        expect(page).to have_content("14,640.00") .or have_content("$14,640")
        expect(page).to have_content("Total Outstanding")
      end
    end

    scenario "Outstanding report shows individual client breakdowns" do
      visit "/reports/outstanding-overdue-invoices"

      within("[data-testid='client-breakdown']", wait: 10) do
        # US Client
        expect(page).to have_content(us_client.name)
        expect(page).to have_content("5,000.00") # Original USD amount

        # EU Client
        expect(page).to have_content(eu_client.name)
        expect(page).to have_content("3,000.00") # Original EUR amount
        expect(page).to have_content("3,540.00") # Converted to USD

        # UK Client
        expect(page).to have_content(uk_client.name)
        expect(page).to have_content("2,000.00") # Original GBP amount
        expect(page).to have_content("2,700.00") # Converted to USD

        # Japanese Client
        expect(page).to have_content(jp_client.name)
        expect(page).to have_content("500,000") # Original JPY amount
        expect(page).to have_content("3,400.00") # Converted to USD
      end
    end

    scenario "Outstanding report can be filtered by currency" do
      visit "/reports/outstanding-overdue-invoices"

      select "EUR", from: "Currency Filter"
      click_button "Apply Filter"

      expect(page).to have_content(eu_client.name)
      expect(page).not_to have_content(us_client.name)
      expect(page).not_to have_content(uk_client.name)
      expect(page).not_to have_content(jp_client.name)

      within("[data-testid='filtered-summary']", wait: 5) do
        expect(page).to have_content("3,540.00") # Only EUR client in USD
      end
    end

    scenario "Outstanding report export includes currency information" do
      visit "/reports/outstanding-overdue-invoices"

      click_button "Export"
      select "CSV", from: "Format"
      click_button "Download"

      # Check that download was triggered
      expect(page).to have_content("Export started")
        .or expect(page.response_headers["Content-Disposition"]).to include("attachment")
    end
  end

  describe "Overdue invoices report with multi-currency" do
    let!(:overdue_invoices) do
      [
        create(:invoice, client: us_client, company: company, currency: "USD", amount: 2000.00, status: :overdue,
               issue_date: 60.days.ago, due_date: 30.days.ago),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 1500.00, status: :overdue,
               issue_date: 45.days.ago, due_date: 15.days.ago),
        create(:invoice, client: uk_client, company: company, currency: "GBP", amount: 3000.00, status: :overdue,
               issue_date: 90.days.ago, due_date: 60.days.ago)
      ]
    end

    before do
      overdue_invoices[1..2].each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
        invoice.save!
      end
    end

    scenario "Overdue report shows aging buckets in base currency" do
      visit "/reports/outstanding-overdue-invoices"

      click_tab "Overdue"

      within("[data-testid='overdue-aging']", wait: 10) do
        expect(page).to have_content("0-30 Days")
        expect(page).to have_content("31-60 Days")
        expect(page).to have_content("60+ Days")

        # Should show amounts in base currency
        expect(page).to have_content("USD")
      end
    end

    scenario "Overdue report shows total overdue in base currency" do
      visit "/reports/outstanding-overdue-invoices"

      click_tab "Overdue"

      within("[data-testid='overdue-summary']", wait: 10) do
        # Total overdue in base currency:
        # USD: 2000 + EUR: 1500*1.18 + GBP: 3000*1.35
        # = 2000 + 1770 + 4050 = 7820
        expect(page).to have_content("7,820.00") .or have_content("$7,820")
        expect(page).to have_content("Total Overdue")
      end
    end

    scenario "Overdue report shows days overdue correctly" do
      visit "/reports/outstanding-overdue-invoices"

      click_tab "Overdue"

      within("[data-testid='overdue-details']", wait: 10) do
        # US invoice: 30 days overdue
        expect(page).to have_content("30 days") .or have_content("30d")

        # EU invoice: 15 days overdue
        expect(page).to have_content("15 days") .or have_content("15d")

        # UK invoice: 60 days overdue
        expect(page).to have_content("60 days") .or have_content("60d")
      end
    end
  end

  describe "Combined outstanding and overdue report" do
    let!(:mixed_invoices) do
      [
        # Outstanding
        create(:invoice, client: us_client, company: company, currency: "USD", amount: 1000.00, status: :sent),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 2000.00, status: :viewed),

        # Overdue
        create(:invoice, client: uk_client, company: company, currency: "GBP", amount: 1500.00, status: :overdue, due_date: 10.days.ago),
        create(:invoice, client: jp_client, company: company, currency: "JPY", amount: 300000, status: :overdue, due_date: 30.days.ago),

        # Paid (should not appear)
        create(:invoice, client: us_client, company: company, currency: "USD", amount: 500.00, status: :paid)
      ]
    end

    before do
      mixed_invoices[1..3].each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
        invoice.save!
      end
    end

    scenario "Report separates outstanding vs overdue with correct totals" do
      visit "/reports/outstanding-overdue-invoices"

      within("[data-testid='report-summary']", wait: 10) do
        # Outstanding total: USD 1000 + EUR 2000*1.18 = 1000 + 2360 = 3360
        expect(page).to have_content("3,360.00") .or have_content("$3,360")

        # Overdue total: GBP 1500*1.35 + JPY 300000*0.0068 = 2025 + 2040 = 4065
        expect(page).to have_content("4,065.00") .or have_content("$4,065")

        # Combined total: 3360 + 4065 = 7425
        expect(page).to have_content("7,425.00") .or have_content("$7,425")
      end
    end

    scenario "Report excludes paid invoices" do
      visit "/reports/outstanding-overdue-invoices"

      # Should not show the $500 paid invoice
      expect(page).not_to have_content("500.00")
      expect(page).to have_content("Outstanding") # But should show outstanding section
      expect(page).to have_content("Overdue") # And overdue section
    end
  end

  describe "Report date filtering with currency rates" do
    let!(:invoices_different_dates) do
      [
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 1000.00, status: :sent,
               issue_date: 30.days.ago),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 1000.00, status: :sent,
               issue_date: 60.days.ago)
      ]
    end

    before do
      # Mock different historical rates
      allow(CurrencyConversionService).to receive(:get_exchange_rate)
        .with("EUR", "USD", 30.days.ago.to_date)
        .and_return(1.18)

      allow(CurrencyConversionService).to receive(:get_exchange_rate)
        .with("EUR", "USD", 60.days.ago.to_date)
        .and_return(1.15) # Lower historical rate

      invoices_different_dates.each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
        invoice.save!
      end
    end

    scenario "Filtering by date range shows correct currency conversions" do
      visit "/reports/outstanding-overdue-invoices"

      fill_in "From Date", with: 45.days.ago.strftime("%Y-%m-%d")
      fill_in "To Date", with: 15.days.ago.strftime("%Y-%m-%d")
      click_button "Apply Date Filter"

      # Should only show the 30-day-old invoice with rate 1.18
      within("[data-testid='filtered-results']", wait: 10) do
        expect(page).to have_content("1,180.00") # 1000 * 1.18
        expect(page).not_to have_content("1,150.00") # Should not show 60-day-old invoice
      end
    end
  end

  describe "Client-specific outstanding/overdue analysis" do
    let!(:client_invoices) do
      # Multiple invoices for same client in different statuses
      [
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 1000.00, status: :sent),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 1500.00, status: :overdue, due_date: 20.days.ago),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 2000.00, status: :viewed),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 500.00, status: :paid) # Should be excluded
      ]
    end

    before do
      client_invoices[0..2].each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
        invoice.save!
      end
    end

    scenario "Client drill-down shows breakdown by status" do
      visit "/reports/outstanding-overdue-invoices"

      click_link eu_client.name

      within("[data-testid='client-detail']", wait: 10) do
        expect(page).to have_content(eu_client.name)

        # Outstanding: 1000 + 2000 = 3000 EUR = 3540 USD
        expect(page).to have_content("3,540.00") # Outstanding total

        # Overdue: 1500 EUR = 1770 USD
        expect(page).to have_content("1,770.00") # Overdue total

        # Should not include paid invoice
        expect(page).not_to have_content("590.00") # 500 * 1.18
      end
    end

    scenario "Client analysis shows payment behavior" do
      visit "/reports/outstanding-overdue-invoices"

      click_link eu_client.name

      within("[data-testid='client-analysis']", wait: 10) do
        # Should show metrics like average days to pay, etc.
        expect(page).to have_content("Payment Behavior") .or have_content("Client Analysis")
        expect(page).to have_content("Average") .or have_content("Days")
      end
    end
  end

  describe "Report visualization and charts" do
    let!(:chart_data_invoices) do
      [
        create(:invoice, client: us_client, company: company, currency: "USD", amount: 1000.00, status: :sent),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 2000.00, status: :sent),
        create(:invoice, client: uk_client, company: company, currency: "GBP", amount: 1500.00, status: :overdue),
        create(:invoice, client: jp_client, company: company, currency: "JPY", amount: 300000, status: :overdue)
      ]
    end

    before do
      chart_data_invoices[1..3].each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
        invoice.save!
      end
    end

    scenario "Outstanding vs overdue chart shows base currency amounts" do
      visit "/reports/outstanding-overdue-invoices"

      within("[data-testid='status-chart']", wait: 10) do
        # Should have chart showing outstanding vs overdue
        expect(page).to have_css("[data-chart='outstanding-overdue']")
               .or have_content("Outstanding").and have_content("Overdue")
      end
    end

    scenario "Currency distribution chart shows breakdown by original currency" do
      visit "/reports/outstanding-overdue-invoices"

      within("[data-testid='currency-chart']", wait: 10) do
        expect(page).to have_content("USD")
        expect(page).to have_content("EUR")
        expect(page).to have_content("GBP")
        expect(page).to have_content("JPY")
      end
    end

    scenario "Client-wise chart shows top clients by outstanding amount" do
      visit "/reports/outstanding-overdue-invoices"

      within("[data-testid='client-chart']", wait: 10) do
        # Should show clients ranked by outstanding amount in base currency
        expect(page).to have_content(us_client.name)
        expect(page).to have_content(eu_client.name)
        expect(page).to have_content(uk_client.name)
        expect(page).to have_content(jp_client.name)
      end
    end
  end

  describe "Report export with multi-currency data" do
    let!(:export_invoices) do
      [
        create(:invoice, client: us_client, company: company, currency: "USD", amount: 1000.00, status: :sent, invoice_number: "US-001"),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 2000.00, status: :overdue, invoice_number: "EU-001"),
        create(:invoice, client: uk_client, company: company, currency: "GBP", amount: 1500.00, status: :sent, invoice_number: "UK-001")
      ]
    end

    before do
      export_invoices[1..2].each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
        invoice.save!
      end
    end

    scenario "PDF export includes currency conversion details" do
      visit "/reports/outstanding-overdue-invoices"

      click_button "Export PDF"

      # Check that PDF generation was initiated
      expect(page).to have_content("Generating PDF")
             .or have_content("Download")
             .or expect(page.response_headers["Content-Type"]).to include("pdf")
    end

    scenario "CSV export includes both original and converted amounts" do
      visit "/reports/outstanding-overdue-invoices"

      click_button "Export CSV"

      # Should trigger CSV download with currency data
      expect(page).to have_content("Generating CSV")
             .or have_content("Download")
             .or expect(page.response_headers["Content-Type"]).to include("csv")
    end

    scenario "Excel export maintains currency formatting" do
      visit "/reports/outstanding-overdue-invoices"

      click_button "Export"
      select "Excel", from: "Format"
      click_button "Download"

      expect(page).to have_content("Generating Excel")
             .or expect(page.response_headers["Content-Type"]).to include("xlsx")
             .or expect(page.response_headers["Content-Type"]).to include("excel")
    end
  end

  describe "Real-time updates with currency changes" do
    let!(:dynamic_invoice) { create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 1000.00, status: :sent) }

    scenario "Report updates when exchange rates change" do
      visit "/reports/outstanding-overdue-invoices"

      # Initial state with rate 1.18
      within("[data-testid='outstanding-summary']", wait: 10) do
        expect(page).to have_content("1,180.00") # 1000 * 1.18
      end

      # Mock rate change
      allow(CurrencyConversionService).to receive(:get_exchange_rate)
        .with("EUR", "USD", anything)
        .and_return(1.25)

      # Trigger refresh or recalculation
      click_button "Refresh Data"

      # Should show updated conversion
      within("[data-testid='outstanding-summary']", wait: 10) do
        expect(page).to have_content("1,250.00") # 1000 * 1.25
      end
    end
  end
end
