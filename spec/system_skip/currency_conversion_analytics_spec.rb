# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Currency Conversion Analytics", type: :system do
  let(:company) { create(:company, base_currency: "USD", name: "Analytics Corp", country: "US") }
  let(:admin_user) { create(:user, current_workspace_id: company.id) }

  # Create clients across different regions for comprehensive analytics
  let(:eur_client) { create(:client, company: company, currency: "EUR", name: "European Enterprises") }
  let(:gbp_client) { create(:client, company: company, currency: "GBP", name: "British Business") }
  let(:jpy_client) { create(:client, company: company, currency: "JPY", name: "Japanese Corp") }
  let(:cad_client) { create(:client, company: company, currency: "CAD", name: "Canadian Co") }
  let(:usd_client) { create(:client, company: company, currency: "USD", name: "US Company") }

  before do
    # Mock exchange rates with realistic fluctuations for analytics
    allow(CurrencyConversionService).to receive(:get_exchange_rate) do |from, to, date|
      base_rates = {
        ["EUR", "USD"] => 1.18,
        ["GBP", "USD"] => 1.35,
        ["JPY", "USD"] => 0.0068,
        ["CAD", "USD"] => 0.75,
        ["USD", "USD"] => 1.0
      }

      rate = base_rates[[from, to]] || 1.0

      # Simulate rate fluctuations over time for analytics
      if date
        days_ago = (Date.current - date).to_i
        fluctuation = Math.sin(days_ago / 30.0) * 0.05 # 5% max fluctuation
        rate * (1 + fluctuation)
      else
        rate
      end
    end

    sign_in(admin_user)
  end

  describe "Currency conversion dashboard overview" do
    let!(:analytics_invoices) do
      # Create invoices over multiple months for trend analysis
      dates = [1, 2, 3, 4, 5, 6].map(&:months).map(&:ago)
      currencies = [
        ["EUR", eur_client], ["GBP", gbp_client], ["JPY", jpy_client],
        ["CAD", cad_client], ["USD", usd_client]
      ]

      dates.product(currencies).map do |date, (currency, client)|
        amount = currency == "JPY" ? 500000 + rand(200000) : 1000 + rand(4000)

        create(:invoice,
          client: client,
          company: company,
          currency: currency,
          amount: amount,
          status: :paid,
          issue_date: date
        ).tap do |invoice|
          invoice.save! # This will trigger calculate_base_currency_amount via callback if currency != "USD"
          invoice.save!
        end
      end
    end

    scenario "Analytics dashboard shows multi-currency overview" do
      visit analytics_currency_conversion_path

      expect(page).to have_content("Currency Conversion Analytics")
      expect(page).to have_content("USD") # Base currency

      within("[data-testid='currency-overview']", wait: 10) do
        expect(page).to have_content("Total Conversions")
        expect(page).to have_content("EUR")
        expect(page).to have_content("GBP")
        expect(page).to have_content("JPY")
        expect(page).to have_content("CAD")

        # Should show volume metrics
        expect(page).to have_content("Volume").or have_content("Amount")
      end
    end

    scenario "Currency mix analysis shows distribution" do
      visit analytics_currency_conversion_path

      within("[data-testid='currency-mix']", wait: 10) do
        expect(page).to have_content("Currency Mix").or have_content("Distribution")

        # Should show percentages for each currency
        expect(page).to have_content("%")

        # Major currencies should be represented
        expect(page).to have_content("EUR")
        expect(page).to have_content("GBP")
      end
    end

    scenario "Conversion volume trends over time" do
      visit analytics_currency_conversion_path

      within("[data-testid='conversion-trends']", wait: 10) do
        expect(page).to have_content("Conversion Trends").or have_content("Volume Trends")
        expect(page).to have_content("Monthly").or have_content("Time")

        # Should show trending data
        expect(page).to have_content("Trend").or(
          have_content("Growth").or(
            have_content("↑").or have_content("↓")
          )
        )
      end
    end
  end

  describe "Exchange rate impact analysis" do
    let!(:rate_impact_data) do
      # Create invoices with significant rate differences
      [
        # EUR invoice when rate was lower (historical disadvantage)
        create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 10000.00,
               status: :paid, issue_date: 90.days.ago),

        # GBP invoice when rate was higher (historical advantage)
        create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 5000.00,
               status: :paid, issue_date: 60.days.ago),

        # Recent invoices at current rates
        create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 8000.00,
               status: :paid, issue_date: 15.days.ago),
        create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 6000.00,
               status: :paid, issue_date: 10.days.ago)
      ]
    end

    before do
      rate_impact_data.each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback if invoice.currency != "USD"
        invoice.save!
      end
    end

    scenario "Rate impact analysis shows gains and losses" do
      visit analytics_currency_conversion_path

      click_button "Exchange Rate Impact"

      within("[data-testid='rate-impact-analysis']", wait: 10) do
        expect(page).to have_content("Exchange Rate Impact").or have_content("Rate Impact")

        # Should show favorable and unfavorable impacts
        expect(page).to have_content("Favorable").or(
          have_content("Gain").or have_content("+")
        )
        expect(page).to have_content("Unfavorable").or(
          have_content("Loss").or have_content("-")
        )

        # Should show impact amounts
        expect(page).to have_content("$").or have_content("USD")
      end
    end

    scenario "Currency-specific rate analysis shows detailed impact" do
      visit analytics_currency_conversion_path

      click_button "Exchange Rate Impact"
      select "EUR", from: "Currency"

      within("[data-testid='currency-specific-impact']", wait: 10) do
        expect(page).to have_content("EUR Impact Analysis")
        expect(page).to have_content("Rate History").or have_content("Historical Rates")

        # Should show EUR-specific metrics
        expect(page).to have_content("€").or have_content("EUR")
        expect(page).to have_content("Current Rate").or have_content("Latest Rate")
      end
    end

    scenario "Rate volatility metrics show currency stability" do
      visit analytics_currency_conversion_path

      click_button "Rate Volatility"

      within("[data-testid='rate-volatility']", wait: 10) do
        expect(page).to have_content("Volatility").or have_content("Stability")

        # Should rank currencies by volatility
        expect(page).to have_content("Most Volatile").or have_content("Least Stable")
        expect(page).to have_content("Most Stable").or have_content("Least Volatile")

        # Should show volatility percentages
        expect(page).to have_content("%").or have_content("Standard Deviation")
      end
    end
  end

  describe "Currency conversion efficiency metrics" do
    let!(:conversion_efficiency_data) do
      # Create data showing different conversion scenarios
      [
        # Same-day conversions (most efficient)
        create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 5000.00,
               status: :paid, issue_date: Date.current),
        create(:payment, invoice: nil, amount: 5000.00, payment_currency: "EUR",
               transaction_date: Date.current),

        # Delayed conversions (less efficient due to rate changes)
        create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 3000.00,
               status: :paid, issue_date: 30.days.ago),
        create(:payment, invoice: nil, amount: 3000.00, payment_currency: "GBP",
               transaction_date: 10.days.ago)
      ]
    end

    before do
      conversion_efficiency_data.each do |record|
        if record.is_a?(Invoice)
          record.save! # This will trigger calculate_base_currency_amount via callback if record.currency != "USD"
        elsif record.is_a?(Payment)
          record.save! # This will trigger calculate_base_currency_amount via callback if record.payment_currency != "USD"
        end
        record.save!
      end
    end

    scenario "Conversion timing analysis shows optimal timing" do
      visit analytics_currency_conversion_path

      click_button "Conversion Efficiency"

      within("[data-testid='conversion-timing']", wait: 10) do
        expect(page).to have_content("Conversion Timing").or have_content("Efficiency")
        expect(page).to have_content("Optimal").or have_content("Best Time")

        # Should show timing recommendations
        expect(page).to have_content("Recommendation").or have_content("Suggested")
      end
    end

    scenario "Conversion cost analysis shows rate spread impact" do
      visit analytics_currency_conversion_path

      click_button "Conversion Costs"

      within("[data-testid='conversion-costs']", wait: 10) do
        expect(page).to have_content("Conversion Costs").or have_content("Rate Spread")
        expect(page).to have_content("Cost").or have_content("Fee")

        # Should show cost breakdown
        expect(page).to have_content("Total Cost").or have_content("Effective Rate")
      end
    end
  end

  describe "Currency risk analytics" do
    let!(:risk_analytics_data) do
      # Create portfolio with various currency exposures
      exposures = [
        ["EUR", 50000], ["GBP", 30000], ["JPY", 5000000],
        ["CAD", 40000], ["USD", 100000]
      ]

      exposures.map do |(currency, amount)|
        client = case currency
                 when "EUR" then eur_client
                 when "GBP" then gbp_client
                 when "JPY" then jpy_client
                 when "CAD" then cad_client
                 else usd_client
        end

        create(:invoice, client: client, company: company, currency: currency,
               amount: amount, status: :sent).tap do |invoice|
          invoice.save! # This will trigger calculate_base_currency_amount via callback if currency != "USD"
          invoice.save!
        end
      end
    end

    scenario "Currency exposure analysis shows risk concentration" do
      visit analytics_currency_conversion_path

      click_button "Risk Analysis"

      within("[data-testid='currency-exposure']", wait: 10) do
        expect(page).to have_content("Currency Exposure").or have_content("Risk Exposure")

        # Should show exposure by currency
        expect(page).to have_content("EUR")
        expect(page).to have_content("GBP")
        expect(page).to have_content("JPY")
        expect(page).to have_content("CAD")

        # Should show risk percentages
        expect(page).to have_content("%").or have_content("Exposure")
      end
    end

    scenario "Value at Risk (VaR) shows potential losses" do
      visit analytics_currency_conversion_path

      click_button "Value at Risk"

      within("[data-testid='var-analysis']", wait: 10) do
        expect(page).to have_content("Value at Risk").or have_content("VaR")
        expect(page).to have_content("95%").or have_content("99%") # Confidence levels

        # Should show potential loss amounts
        expect(page).to have_content("Potential Loss").or have_content("Maximum Loss")
        expect(page).to have_content("$").or have_content("USD")
      end
    end

    scenario "Diversification analysis shows portfolio balance" do
      visit analytics_currency_conversion_path

      click_button "Diversification"

      within("[data-testid='diversification-analysis']", wait: 10) do
        expect(page).to have_content("Diversification").or have_content("Portfolio Balance")
        expect(page).to have_content("Concentration Risk").or have_content("Risk Score")

        # Should show diversification score
        expect(page).to have_content("Score").or have_content("Rating")
      end
    end
  end

  describe "Currency conversion forecasting" do
    let!(:forecasting_data) do
      # Create historical pattern for forecasting
      12.times do |i|
        month = (i + 1).months.ago

        # Create invoices with seasonal patterns
        amount = 5000 + (1000 * Math.sin(i / 2.0)) # Seasonal variation

        create(:invoice,
          client: eur_client,
          company: company,
          currency: "EUR",
          amount: amount,
          status: :paid,
          issue_date: month
        ).tap do |invoice|
          invoice.save! # This will trigger calculate_base_currency_amount via callback
          invoice.save!
        end
      end
    end

    scenario "Conversion volume forecast shows predicted volumes" do
      visit analytics_currency_conversion_path

      click_button "Forecasting"

      within("[data-testid='volume-forecast']", wait: 10) do
        expect(page).to have_content("Volume Forecast").or have_content("Predicted Volume")
        expect(page).to have_content("Next 3 Months").or have_content("Forecast Period")

        # Should show forecast numbers
        expect(page).to have_content("Forecast").or have_content("Prediction")
      end
    end

    scenario "Rate trend forecast shows expected rate movements" do
      visit analytics_currency_conversion_path

      click_button "Rate Forecast"

      within("[data-testid='rate-forecast']", wait: 10) do
        expect(page).to have_content("Rate Forecast").or have_content("Exchange Rate Prediction")
        expect(page).to have_content("Trend").or have_content("Direction")

        # Should show rate predictions
        expect(page).to have_content("Bullish").or(
          have_content("Bearish").or(
            have_content("↑").or have_content("↓")
          )
        )
      end
    end

    scenario "Seasonal analysis shows conversion patterns" do
      visit analytics_currency_conversion_path

      click_button "Seasonal Analysis"

      within("[data-testid='seasonal-analysis']", wait: 10) do
        expect(page).to have_content("Seasonal").or have_content("Pattern")
        expect(page).to have_content("Q1").or(
          have_content("Quarter").or have_content("Monthly")
        )

        # Should show seasonal insights
        expect(page).to have_content("Peak").or(
          have_content("Low").or(
            have_content("High Season").or have_content("Low Season")
          )
        )
      end
    end
  end

  describe "Client-specific currency analytics" do
    let!(:client_currency_data) do
      # Create comprehensive client currency history
      clients_and_currencies = [
        [eur_client, "EUR"], [gbp_client, "GBP"], [jpy_client, "JPY"]
      ]

      clients_and_currencies.map do |client, currency|
        # Multiple transactions per client
        5.times do |i|
          amount = currency == "JPY" ? 500000 + (i * 100000) : 2000 + (i * 500)

          create(:invoice,
            client: client,
            company: company,
            currency: currency,
            amount: amount,
            status: :paid,
            issue_date: (i * 30).days.ago
          ).tap do |invoice|
            invoice.save! # This will trigger calculate_base_currency_amount via callback
            invoice.save!
          end
        end
      end.flatten
    end

    scenario "Client currency analysis shows individual client patterns" do
      visit analytics_currency_conversion_path

      click_link eur_client.name

      within("[data-testid='client-currency-analysis']", wait: 10) do
        expect(page).to have_content(eur_client.name)
        expect(page).to have_content("EUR") # Client's currency
        expect(page).to have_content("USD") # Base currency

        # Should show client-specific metrics
        expect(page).to have_content("Total Converted").or have_content("Conversion Volume")
        expect(page).to have_content("Average Rate").or have_content("Weighted Rate")
      end
    end

    scenario "Client rate impact shows per-client gains/losses" do
      visit analytics_currency_conversion_path

      click_link eur_client.name

      within("[data-testid='client-rate-impact']", wait: 10) do
        expect(page).to have_content("Rate Impact").or have_content("Exchange Impact")

        # Should show if client's currency movements were favorable
        expect(page).to have_content("Favorable").or(
          have_content("Unfavorable").or(
            have_content("Gain").or have_content("Loss")
          )
        )
      end
    end

    scenario "Client currency risk profile shows exposure level" do
      visit analytics_currency_conversion_path

      click_link eur_client.name

      within("[data-testid='client-risk-profile']", wait: 10) do
        expect(page).to have_content("Risk Profile").or have_content("Currency Risk")
        expect(page).to have_content("Low").or(
          have_content("Medium").or have_content("High") # Risk level
        )

        # Should show risk score or rating
        expect(page).to have_content("Score").or have_content("Rating")
      end
    end
  end

  describe "Currency conversion reports and exports" do
    let!(:report_data) do
      # Create rich dataset for comprehensive reporting
      currencies = ["EUR", "GBP", "JPY", "CAD"]
      statuses = [:paid, :sent, :overdue]

      currencies.product(statuses).map do |(currency, status)|
        client = case currency
                 when "EUR" then eur_client
                 when "GBP" then gbp_client
                 when "JPY" then jpy_client
                 else cad_client
        end

        amount = currency == "JPY" ? rand(500000..1000000) : rand(1000..5000)

        create(:invoice,
          client: client,
          company: company,
          currency: currency,
          amount: amount,
          status: status,
          issue_date: rand(90).days.ago
        ).tap do |invoice|
          invoice.save! # This will trigger calculate_base_currency_amount via callback
          invoice.save!
        end
      end
    end

    scenario "Comprehensive analytics report export" do
      visit analytics_currency_conversion_path

      click_button "Export Analytics"
      select "Comprehensive Report", from: "Report Type"
      select "PDF", from: "Format"

      within("[data-testid='export-options']", wait: 5) do
        check "Include Rate History"
        check "Include Risk Analysis"
        check "Include Forecasts"
        check "Include Client Breakdown"
        click_button "Generate Report"
      end

      expect(page).to have_content("Generating report").or(
        expect(page.response_headers["Content-Type"]).to include("pdf")
      )
    end

    scenario "Currency analytics CSV export with detailed data" do
      visit analytics_currency_conversion_path

      click_button "Export Data"
      select "CSV", from: "Format"

      within("[data-testid='csv-options']", wait: 5) do
        check "Include Exchange Rates"
        check "Include Conversion Dates"
        check "Include Rate Sources"
        click_button "Download CSV"
      end

      expect(page).to have_content("Preparing export").or(
        expect(page.response_headers["Content-Type"]).to include("csv")
      )
    end

    scenario "Excel analytics workbook with multiple sheets" do
      visit analytics_currency_conversion_path

      click_button "Export Analytics"
      select "Excel Workbook", from: "Report Type"

      within("[data-testid='excel-options']", wait: 5) do
        check "Summary Sheet"
        check "Rate History Sheet"
        check "Risk Analysis Sheet"
        check "Client Analysis Sheet"
        check "Include Charts"
        click_button "Generate Workbook"
      end

      expect(page).to have_content("Creating workbook").or(
        expect(page.response_headers["Content-Type"]).to include("xlsx")
      )
    end
  end

  describe "Advanced currency analytics features" do
    scenario "Currency correlation analysis shows relationships" do
      visit analytics_currency_conversion_path

      click_button "Advanced Analytics"
      click_button "Currency Correlations"

      within("[data-testid='currency-correlations']", wait: 10) do
        expect(page).to have_content("Currency Correlations").or have_content("Relationships")

        # Should show correlation matrix or pairs
        expect(page).to have_content("EUR/USD").or have_content("GBP/USD")
        expect(page).to have_content("Correlation").or have_content("Relationship")
      end
    end

    scenario "Currency performance benchmarking" do
      visit analytics_currency_conversion_path

      click_button "Performance Benchmark"

      within("[data-testid='performance-benchmark']", wait: 10) do
        expect(page).to have_content("Performance").or have_content("Benchmark")
        expect(page).to have_content("vs Market").or have_content("vs Index")

        # Should show relative performance
        expect(page).to have_content("Outperform").or(
          have_content("Underperform").or(
            have_content("Better").or have_content("Worse")
          )
        )
      end
    end

    scenario "Monte Carlo simulation for currency risk" do
      visit analytics_currency_conversion_path

      click_button "Risk Simulation"

      within("[data-testid='monte-carlo-simulation']", wait: 10) do
        expect(page).to have_content("Monte Carlo").or have_content("Simulation")
        expect(page).to have_content("Scenarios").or have_content("Simulations")

        # Should show simulation results
        expect(page).to have_content("Probability").or have_content("Likelihood")
        expect(page).to have_content("%") # Probability percentages
      end
    end
  end

  describe "Real-time currency analytics updates" do
    scenario "Live rate feeds update analytics in real-time" do
      visit analytics_currency_conversion_path

      # Initial state
      within("[data-testid='live-rates']", wait: 5) do
        expect(page).to have_content("Live Rates").or have_content("Current Rates")
        expect(page).to have_content("EUR")
        expect(page).to have_content("GBP")
      end

      # Should auto-refresh or have refresh capability
      expect(page).to have_button("Refresh Rates").or(
        have_content("Auto-refresh").or have_css("[data-auto-refresh]")
      )
    end

    scenario "Alert system for significant rate movements" do
      visit analytics_currency_conversion_path

      click_button "Rate Alerts"

      within("[data-testid='rate-alerts']", wait: 5) do
        expect(page).to have_content("Rate Alerts").or have_content("Currency Alerts")
        expect(page).to have_content("Threshold").or have_content("Trigger")

        # Should allow setting alert thresholds
        expect(page).to have_field("Alert Threshold").or have_field("Rate Change %")
      end
    end
  end
end
