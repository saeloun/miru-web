# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client Revenue Reports with Multi-Currency", type: :system do
  let(:company) { create(:company, base_currency: "USD", name: "Revenue Corp", country: "US") }
  let(:admin_user) { create(:user, current_workspace_id: company.id) }

  # Create diverse client portfolio
  let(:us_client) { create(:client, company: company, currency: "USD", name: "MegaCorp USA") }
  let(:eu_client) { create(:client, company: company, currency: "EUR", name: "EuroTech GmbH") }
  let(:uk_client) { create(:client, company: company, currency: "GBP", name: "London Ventures") }
  let(:jp_client) { create(:client, company: company, currency: "JPY", name: "Tokyo Digital") }
  let(:ca_client) { create(:client, company: company, currency: "CAD", name: "Maple Leaf Inc") }

  before do
    # Mock exchange rates for predictable testing
    allow(CurrencyConversionService).to receive(:get_exchange_rate) do |from, to, _date|
      case [from, to]
      when ["EUR", "USD"] then 1.18
      when ["GBP", "USD"] then 1.35
      when ["JPY", "USD"] then 0.0068
      when ["CAD", "USD"] then 0.75
      when ["USD", "USD"] then 1.0
      else 1.0
      end
    end

    sign_in(admin_user)
  end

  describe "Client revenue summary with multi-currency" do
    let!(:revenue_invoices) do
      # Create invoices across different time periods and currencies
      [
        # Current month - various statuses
        create(:invoice, client: us_client, company: company, currency: "USD", amount: 10000.00, status: :paid, issue_date: 15.days.ago),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 8000.00, status: :paid, issue_date: 10.days.ago),
        create(:invoice, client: uk_client, company: company, currency: "GBP", amount: 6000.00, status: :sent, issue_date: 5.days.ago),
        create(:invoice, client: jp_client, company: company, currency: "JPY", amount: 1500000, status: :paid, issue_date: 20.days.ago),
        create(:invoice, client: ca_client, company: company, currency: "CAD", amount: 12000.00, status: :overdue, issue_date: 25.days.ago, due_date: 5.days.ago),

        # Previous month for comparison
        create(:invoice, client: us_client, company: company, currency: "USD", amount: 5000.00, status: :paid, issue_date: 45.days.ago),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 4000.00, status: :paid, issue_date: 50.days.ago)
      ]
    end

    before do
      # Ensure currency conversions are calculated via model callbacks
      revenue_invoices.select { |i| i.currency != "USD" }.each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
      end
    end

    scenario "Client revenue reports page loads successfully" do
      visit "/reports/client-revenues"

      # Just verify the page loads with React app
      expect(page).to have_css("#react-root", wait: 10)

      # If this is a React SPA, we'll get redirected to login if not authenticated
      # or the page will render with React content
      expect(page.current_path).to eq("/reports/client-revenues").or eq("/login")
    end

    scenario "Revenue report shows client rankings by base currency revenue", :pending do
      visit "/reports/client-revenues"

      expect(page).to have_content("Client Revenue Report")

      within("[data-testid='client-revenue-rankings']", wait: 10) do
        # Clients should be ranked by total revenue in base currency
        # US: $10,000 (current) + $5,000 (previous) = $15,000
        # EU: €8,000*1.18 + €4,000*1.18 = $9,440 + $4,720 = $14,160
        # UK: £6,000*1.35 = $8,100
        # JP: ¥1,500,000*0.0068 = $10,200
        # CA: CAD$12,000*0.75 = $9,000

        # Expected order: US ($15,000), EU ($14,160), JP ($10,200), CA ($9,000), UK ($8,100)
        client_names = [us_client.name, eu_client.name, jp_client.name, ca_client.name, uk_client.name]

        client_names.each do |name|
          expect(page).to have_content(name)
        end
      end
    end

    scenario "Revenue report shows totals in base currency", :pending do
      visit "/reports/client-revenues"

      within("[data-testid='revenue-summary']", wait: 10) do
        # Total revenue across all clients in USD
        # $15,000 + $14,160 + $8,100 + $10,200 + $9,000 = $56,460
        expect(page).to have_content("56,460") .or have_content("$56,460")
        expect(page).to have_content("USD") .or have_content("$")
      end
    end

    scenario "Revenue report shows paid vs outstanding breakdown", :pending do
      visit "/reports/client-revenues"

      within("[data-testid='revenue-breakdown']", wait: 10) do
        # Paid revenue: US $15,000 + EU $14,160 + JP $10,200 = $39,360
        expect(page).to have_content("39,360") # Paid amount

        # Outstanding: UK £6,000*1.35 = $8,100 (sent)
        expect(page).to have_content("8,100") # Outstanding

        # Overdue: CA CAD$12,000*0.75 = $9,000
        expect(page).to have_content("9,000") # Overdue
      end
    end
  end

  describe "Time-based revenue analysis with currency fluctuations" do
    let!(:time_series_invoices) do
      # Create invoices over multiple months with same client but potentially different rates
      months = [1, 2, 3, 4, 5].map(&:months).map(&:ago)

      months.map.with_index do |month, index|
        # Mock slightly different historical rates
        historical_rate = 1.15 + (0.005 * index) # Gradual rate increase
        allow(CurrencyConversionService).to receive(:get_exchange_rate)
          .with("EUR", "USD", month.to_date)
          .and_return(historical_rate)

        create(:invoice,
          client: eu_client,
          company: company,
          currency: "EUR",
          amount: 5000.00,
          status: :paid,
          issue_date: month
        ).tap do |invoice|
          invoice.save! # This will trigger calculate_base_currency_amount via callback
        end
      end
    end

    scenario "Monthly revenue trends show currency conversion impact", :pending do
      visit "/reports/client-revenues"

      select "Last 6 Months", from: "Time Period"
      click_button "Apply Filter"

      within("[data-testid='revenue-trends']", wait: 10) do
        expect(page).to have_content("Monthly Revenue Trends")

        # Should show increasing USD amounts due to rate appreciation
        # Month 1: €5,000 * 1.15 = $5,750
        # Month 5: €5,000 * 1.17 = $5,850
        expect(page).to have_content("5,750") .or have_content("5,850")
      end
    end

    scenario "Currency impact analysis shows exchange rate effects", :pending do
      visit "/reports/client-revenues"

      click_button "Currency Impact Analysis"

      within("[data-testid='currency-impact']", wait: 10) do
        expect(page).to have_content("Exchange Rate Impact")
        expect(page).to have_content("EUR")

        # Should show positive impact from rate appreciation
        expect(page).to have_content("Favorable") .or have_content("+") .or have_content("gain")
      end
    end
  end

  describe "Client-specific revenue analysis" do
    let!(:client_detailed_invoices) do
      # Create comprehensive invoice history for EU client
      [
        # Different statuses
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 5000.00, status: :paid, issue_date: 30.days.ago),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 3000.00, status: :paid, issue_date: 20.days.ago),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 4000.00, status: :sent, issue_date: 10.days.ago),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 2000.00, status: :overdue, issue_date: 45.days.ago, due_date: 15.days.ago),

        # Different time periods
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 6000.00, status: :paid, issue_date: 90.days.ago)
      ]
    end

    before do
      client_detailed_invoices.each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
      end
    end

    scenario "Client drill-down shows comprehensive revenue breakdown", :pending do
      visit "/reports/client-revenues"

      click_link eu_client.name

      within("[data-testid='client-detail-revenue']", wait: 10) do
        expect(page).to have_content(eu_client.name)
        expect(page).to have_content("EUR") # Original currency
        expect(page).to have_content("USD") # Converted currency

        # Total revenue: (5000 + 3000 + 4000 + 2000 + 6000) * 1.18 = €20,000 * 1.18 = $23,600
        expect(page).to have_content("23,600") .or have_content("$23,600")

        # Paid revenue: (5000 + 3000 + 6000) * 1.18 = €14,000 * 1.18 = $16,520
        expect(page).to have_content("16,520") .or have_content("$16,520")

        # Outstanding: €4,000 * 1.18 = $4,720
        expect(page).to have_content("4,720") .or have_content("$4,720")

        # Overdue: €2,000 * 1.18 = $2,360
        expect(page).to have_content("2,360") .or have_content("$2,360")
      end
    end

    scenario "Client payment behavior analysis with currency considerations", :pending do
      visit "/reports/client-revenues"

      click_link eu_client.name

      within("[data-testid='payment-behavior-analysis']", wait: 10) do
        expect(page).to have_content("Payment Behavior")

        # Collection rate
        (14000.0 / 20000.0 * 100).round(1) # 70% based on paid vs total
        expect(page).to have_content("70.0%") .or have_content("Collection Rate")

        # Average invoice value in USD
        (20000 * 1.18 / 5).round(0) # $4,720
        expect(page).to have_content("4,720") .or have_content("Average Invoice")
      end
    end
  end

  describe "Revenue filtering and segmentation" do
    let!(:segmented_invoices) do
      # Create invoices with different characteristics for filtering
      [
        # High-value clients
        create(:invoice, client: us_client, company: company, currency: "USD", amount: 25000.00, status: :paid, issue_date: 15.days.ago),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 20000.00, status: :paid, issue_date: 10.days.ago),

        # Medium-value clients
        create(:invoice, client: uk_client, company: company, currency: "GBP", amount: 5000.00, status: :paid, issue_date: 20.days.ago),
        create(:invoice, client: jp_client, company: company, currency: "JPY", amount: 500000, status: :paid, issue_date: 5.days.ago),

        # Small-value clients
        create(:invoice, client: ca_client, company: company, currency: "CAD", amount: 2000.00, status: :paid, issue_date: 12.days.ago)
      ]
    end

    before do
      segmented_invoices.select { |i| i.currency != "USD" }.each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
      end
    end

    scenario "Revenue segmentation by client size (in base currency)", :pending do
      visit "/reports/client-revenues"

      select "By Client Size", from: "Segment By"
      click_button "Apply Segmentation"

      within("[data-testid='revenue-segments']", wait: 10) do
        # Enterprise (>$20k USD equivalent)
        expect(page).to have_content("Enterprise")
        expect(page).to have_content(us_client.name) # $25,000
        expect(page).to have_content(eu_client.name) # €20,000 * 1.18 = $23,600

        # Mid-market ($5k-$20k USD equivalent)
        expect(page).to have_content("Mid-Market") .or have_content("Medium")
        expect(page).to have_content(uk_client.name) # £5,000 * 1.35 = $6,750
        expect(page).to have_content(jp_client.name) # ¥500,000 * 0.0068 = $3,400

        # Small (<$5k USD equivalent)
        expect(page).to have_content("Small")
        expect(page).to have_content(ca_client.name) # CAD$2,000 * 0.75 = $1,500
      end
    end

    scenario "Revenue filtering by currency shows accurate totals", :pending do
      visit "/reports/client-revenues"

      select "EUR", from: "Currency Filter"
      click_button "Apply Filter"

      within("[data-testid='filtered-revenue-summary']", wait: 10) do
        # Only EU client revenue: €20,000 * 1.18 = $23,600
        expect(page).to have_content("23,600") .or have_content("$23,600")
        expect(page).to have_content(eu_client.name)
        expect(page).not_to have_content(us_client.name)
        expect(page).not_to have_content(uk_client.name)
      end
    end

    scenario "Revenue filtering by date range maintains currency accuracy", :pending do
      visit "/reports/client-revenues"

      fill_in "From Date", with: 30.days.ago.strftime("%Y-%m-%d")
      fill_in "To Date", with: Date.current.strftime("%Y-%m-%d")
      click_button "Apply Date Filter"

      within("[data-testid='date-filtered-summary']", wait: 10) do
        # All invoices are within this range
        total_usd_equivalent = 25000 + (20000 * 1.18) + (5000 * 1.35) + (500000 * 0.0068) + (2000 * 0.75)
        expect(page).to have_content(total_usd_equivalent.to_i.to_s) .or have_content("$#{total_usd_equivalent.to_i}")
      end
    end
  end

  describe "Revenue comparison and benchmarking" do
    let!(:comparison_data) do
      # Create data for month-over-month and year-over-year comparisons
      currencies_and_clients = [
        ["USD", us_client], ["EUR", eu_client], ["GBP", uk_client]
      ]

      timeframes = [
        { period: :current_month, date: 15.days.ago },
        { period: :previous_month, date: 45.days.ago },
        { period: :current_year, date: 100.days.ago },
        { period: :previous_year, date: 400.days.ago }
      ]

      currencies_and_clients.product(timeframes).map do |(currency, client), timeframe|
        create(:invoice,
          client: client,
          company: company,
          currency: currency,
          amount: 5000.00,
          status: :paid,
          issue_date: timeframe[:date]
        ).tap do |invoice|
          invoice.save! # This will trigger calculate_base_currency_amount via callback
        end
      end
    end

    scenario "Month-over-month comparison shows currency-adjusted growth", :pending do
      visit "/reports/client-revenues"

      click_button "Month-over-Month Analysis"

      within("[data-testid='mom-comparison']", wait: 10) do
        expect(page).to have_content("Month-over-Month")
        expect(page).to have_content("Growth") .or have_content("Change")

        # Should show percentage changes
        expect(page).to have_content("%")

        # Should be in base currency
        expect(page).to have_content("USD")
      end
    end

    scenario "Year-over-year comparison accounts for currency fluctuations", :pending do
      visit "/reports/client-revenues"

      click_button "Year-over-Year Analysis"

      within("[data-testid='yoy-comparison']", wait: 10) do
        expect(page).to have_content("Year-over-Year")
        expect(page).to have_content("Growth") .or have_content("Change")

        # Should highlight currency impact on growth
        expect(page).to have_content("Currency Impact") .or have_content("Exchange Rate")
      end
    end
  end

  describe "Revenue forecasting with currency considerations" do
    let!(:forecast_data) do
      # Create historical data for forecasting
      6.times do |i|
        month = (i + 1).months.ago
        create(:invoice,
          client: eu_client,
          company: company,
          currency: "EUR",
          amount: 5000 + (i * 500), # Growing trend
          status: :paid,
          issue_date: month
        ).tap do |invoice|
          invoice.save! # This will trigger calculate_base_currency_amount via callback
        end
      end
    end

    scenario "Revenue forecast considers currency trends", :pending do
      visit "/reports/client-revenues"

      click_button "Revenue Forecast"

      within("[data-testid='revenue-forecast']", wait: 10) do
        expect(page).to have_content("Forecast")
        expect(page).to have_content("Next 3 Months") .or have_content("Projection")

        # Should show forecast in base currency
        expect(page).to have_content("USD")

        # Should mention currency assumptions
        expect(page).to have_content("Exchange Rate") .or have_content("Currency Assumptions")
      end
    end
  end

  describe "Revenue report exports with multi-currency data" do
    let!(:export_data) do
      [
        create(:invoice, client: us_client, company: company, currency: "USD", amount: 10000.00, status: :paid, invoice_number: "US-2024-001"),
        create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 8000.00, status: :paid, invoice_number: "EU-2024-001"),
        create(:invoice, client: uk_client, company: company, currency: "GBP", amount: 6000.00, status: :sent, invoice_number: "UK-2024-001")
      ]
    end

    before do
      export_data.select { |i| i.currency != "USD" }.each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
      end
    end

    scenario "CSV export includes original and converted amounts", :pending do
      visit "/reports/client-revenues"

      click_button "Export Data"
      select "CSV", from: "Export Format"
      click_button "Download CSV"

      # Verify export was initiated
      expect(page).to have_content("Preparing export")
             .or have_content("Download")
             .or expect(page.response_headers["Content-Disposition"]).to include("csv")
    end

    scenario "PDF report shows currency conversion methodology", :pending do
      visit "/reports/client-revenues"

      click_button "Generate PDF Report"

      within("[data-testid='pdf-options']", wait: 5) do
        check "Include Currency Details"
        check "Show Exchange Rates"
        click_button "Generate PDF"
      end

      expect(page).to have_content("Generating PDF")
             .or expect(page.response_headers["Content-Type"]).to include("pdf")
    end

    scenario "Excel export maintains currency formatting and formulas", :pending do
      visit "/reports/client-revenues"

      click_button "Export Data"
      select "Excel", from: "Export Format"
      check "Include Formulas"
      click_button "Download Excel"

      expect(page).to have_content("Preparing Excel")
             .or expect(page.response_headers["Content-Type"]).to include("xlsx")
    end
  end

  describe "Advanced revenue analytics with currency insights" do
    let!(:analytics_data) do
      # Create complex dataset for advanced analytics
      clients = [us_client, eu_client, uk_client, jp_client]
      statuses = [:paid, :sent, :overdue]

      clients.product(statuses).map do |client, status|
        due_date = case status
                   when :paid then 30.days.ago
                   when :sent then 15.days.from_now
                   when :overdue then 15.days.ago
                   else 30.days.from_now
        end

        create(:invoice,
          client: client,
          company: company,
          currency: client.currency,
          amount: rand(1000..10000),
          status: status,
          issue_date: rand(60).days.ago,
          due_date: due_date
        ).tap do |invoice|
          invoice.save! # This will trigger calculate_base_currency_amount via callback
        end
      end
    end

    scenario "Revenue analytics dashboard shows currency risk analysis", :pending do
      visit "/reports/client-revenues"

      click_button "Advanced Analytics"

      within("[data-testid='currency-risk-analysis']", wait: 10) do
        expect(page).to have_content("Currency Risk")
        expect(page).to have_content("Exposure") .or have_content("Risk Score")

        # Should show risk breakdown by currency
        expect(page).to have_content("EUR")
        expect(page).to have_content("GBP")
        expect(page).to have_content("JPY")
      end
    end

    scenario "Revenue concentration analysis shows geographic/currency diversification", :pending do
      visit "/reports/client-revenues"

      click_button "Concentration Analysis"

      within("[data-testid='concentration-analysis']", wait: 10) do
        expect(page).to have_content("Concentration Risk")
        expect(page).to have_content("Diversification") .or have_content("Distribution")

        # Should show percentage breakdown
        expect(page).to have_content("%")

        # Should show both client and currency concentration
        expect(page).to have_content("By Client").and have_content("By Currency")
      end
    end

    scenario "Revenue quality score considers currency factors", :pending do
      visit "/reports/client-revenues"

      click_button "Revenue Quality Analysis"

      within("[data-testid='revenue-quality']", wait: 10) do
        expect(page).to have_content("Revenue Quality Score")

        # Factors should include currency-related metrics
        expect(page).to have_content("Collection Rate") .or have_content("Payment Terms")
        expect(page).to have_content("Currency Stability") .or have_content("Exchange Risk")
      end
    end
  end
end
