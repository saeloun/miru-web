# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Multi-Currency Payment Management", type: :system do
  let(:company) { create(:company, base_currency: "USD", name: "Test Company", country: "US") }
  let(:admin_user) { create(:user, current_workspace_id: company.id) }

  let(:eur_client) { create(:client, company: company, currency: "EUR", name: "European Client") }
  let(:gbp_client) { create(:client, company: company, currency: "GBP", name: "UK Client") }
  let(:jpy_client) { create(:client, company: company, currency: "JPY", name: "Japanese Client") }

  let!(:eur_invoice) { create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 5000.00, status: :sent) }
  let!(:gbp_invoice) { create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 3000.00, status: :sent) }
  let!(:jpy_invoice) { create(:invoice, client: jpy_client, company: company, currency: "JPY", amount: 500000, status: :sent) }

  before do
    # Mock currency conversion service for predictable tests
    allow(CurrencyConversionService).to receive(:get_exchange_rate) do |from, to, date|
      base_rates = {
        ["EUR", "USD"] => 1.18,
        ["GBP", "USD"] => 1.35,
        ["JPY", "USD"] => 0.0068,
        ["USD", "USD"] => 1.0
      }

      # Simulate slight rate changes over time
      rate = base_rates[[from, to]] || 1.0
      if date && date < 10.days.ago.to_date
        rate * 0.98 # Slightly lower historical rate
      else
        rate
      end
    end

    # Ensure invoices have currency conversions
    [eur_invoice, gbp_invoice, jpy_invoice].each do |invoice|
      invoice.save! # This will trigger calculate_base_currency_amount via callback
      invoice.save!
    end

    sign_in(admin_user)
  end

  describe "Creating payments with currency conversion" do
    scenario "Full payment in EUR matches exchange rate at payment date" do
      visit invoice_path(eur_invoice)

      click_button "Record Payment"

      within("[data-testid='payment-form']", wait: 5) do
        fill_in "Amount", with: "5000.00"
        select "Bank Transfer", from: "Payment Method"
        fill_in "Transaction Date", with: Date.current.strftime("%Y-%m-%d")
        fill_in "Notes", with: "Full payment in EUR"

        click_button "Record Payment"
      end

      expect(page).to have_content("Payment recorded successfully")

      payment = Payment.last
      expect(payment.amount).to eq(5000.00)
      expect(payment.payment_currency).to eq("EUR")
      expect(payment.base_currency_amount).to eq(5900.00) # 5000 * 1.18
      expect(payment.exchange_rate).to eq(1.18)
      expect(payment.exchange_rate_date).to eq(Date.current)

      # Verify invoice is marked as paid
      eur_invoice.reload
      expect(eur_invoice.status).to eq("paid")
    end

    scenario "Partial payment in GBP with rate tracking" do
      visit invoice_path(gbp_invoice)

      click_button "Record Payment"

      within("[data-testid='payment-form']", wait: 5) do
        fill_in "Amount", with: "1500.00" # Half payment
        select "Credit Card", from: "Payment Method"
        fill_in "Transaction Date", with: Date.current.strftime("%Y-%m-%d")

        click_button "Record Payment"
      end

      expect(page).to have_content("Payment recorded successfully")

      payment = Payment.last
      expect(payment.amount).to eq(1500.00)
      expect(payment.payment_currency).to eq("GBP")
      expect(payment.base_currency_amount).to eq(2025.00) # 1500 * 1.35
      expect(payment.exchange_rate).to eq(1.35)

      # Verify invoice is partially paid
      gbp_invoice.reload
      expect(gbp_invoice.status).to eq("sent") # Still outstanding
      expect(gbp_invoice.amount_due).to eq(1500.00) # Remaining amount
    end

    scenario "Payment in JPY with high precision conversion" do
      visit invoice_path(jpy_invoice)

      click_button "Record Payment"

      within("[data-testid='payment-form']", wait: 5) do
        fill_in "Amount", with: "250000" # Half payment
        select "Bank Transfer", from: "Payment Method"
        fill_in "Transaction Date", with: Date.current.strftime("%Y-%m-%d")

        click_button "Record Payment"
      end

      expect(page).to have_content("Payment recorded successfully")

      payment = Payment.last
      expect(payment.amount).to eq(250000.0)
      expect(payment.payment_currency).to eq("JPY")
      expect(payment.base_currency_amount).to eq(1700.00) # 250000 * 0.0068
      expect(payment.exchange_rate).to eq(0.0068)
    end
  end

  describe "Multiple payments with rate changes over time" do
    scenario "Multiple payments on same invoice with different rates" do
      # First payment
      visit invoice_path(eur_invoice)
      click_button "Record Payment"

      within("[data-testid='payment-form']", wait: 5) do
        fill_in "Amount", with: "2000.00"
        select "Bank Transfer", from: "Payment Method"
        fill_in "Transaction Date", with: Date.current.strftime("%Y-%m-%d")
        click_button "Record Payment"
      end

      expect(page).to have_content("Payment recorded successfully")

      # Mock rate change for second payment
      allow(CurrencyConversionService).to receive(:get_exchange_rate)
        .with("EUR", "USD", 5.days.from_now.to_date)
        .and_return(1.20) # Higher rate

      # Second payment (simulate time passage)
      visit invoice_path(eur_invoice)
      click_button "Record Payment"

      within("[data-testid='payment-form']", wait: 5) do
        fill_in "Amount", with: "3000.00"
        select "Bank Transfer", from: "Payment Method"
        fill_in "Transaction Date", with: 5.days.from_now.strftime("%Y-%m-%d")
        click_button "Record Payment"
      end

      payments = eur_invoice.payments.order(:created_at)

      # First payment
      expect(payments.first.amount).to eq(2000.00)
      expect(payments.first.base_currency_amount).to eq(2360.00) # 2000 * 1.18
      expect(payments.first.exchange_rate).to eq(1.18)

      # Second payment (higher rate)
      expect(payments.last.amount).to eq(3000.00)
      expect(payments.last.base_currency_amount).to eq(3600.00) # 3000 * 1.20
      expect(payments.last.exchange_rate).to eq(1.20)
    end
  end

  describe "Payment history and audit trail" do
    let!(:payment1) { create(:payment, invoice: eur_invoice, amount: 2000.00, transaction_date: 10.days.ago) }
    let!(:payment2) { create(:payment, invoice: eur_invoice, amount: 1500.00, transaction_date: 5.days.ago) }

    before do
      [payment1, payment2].each do |payment|
        payment.save! # This will trigger calculate_base_currency_amount via callback
        payment.save!
      end
    end

    scenario "Payment history shows currency conversion details" do
      visit invoice_path(eur_invoice)

      within("[data-testid='payment-history']", wait: 5) do
        # Should show both payments with conversion details
        expect(page).to have_content("€2,000.00")
        expect(page).to have_content("€1,500.00")

        # Should show base currency amounts
        expect(page).to have_content("$2,360.00").or have_content("2,360.00")
        expect(page).to have_content("$1,770.00").or have_content("1,770.00")

        # Should show exchange rates
        expect(page).to have_content("1.18").or have_content("Rate: 1.18")
      end
    end

    scenario "Payment details show full conversion information" do
      visit payment_path(payment1)

      expect(page).to have_content("Payment Details")
      expect(page).to have_content("€2,000.00") # Original amount
      expect(page).to have_content("$2,360.00") # Converted amount
      expect(page).to have_content("1.18") # Exchange rate
      expect(page).to have_content(payment1.exchange_rate_date.strftime("%Y-%m-%d")) # Rate date
    end
  end

  describe "Payment filtering and search with multi-currency" do
    let!(:eur_payment) { create(:payment, invoice: eur_invoice, amount: 1000.00, status: :paid, transaction_type: :bank_transfer) }
    let!(:gbp_payment) { create(:payment, invoice: gbp_invoice, amount: 2000.00, status: :paid, transaction_type: :stripe) }
    let!(:jpy_payment) { create(:payment, invoice: jpy_invoice, amount: 100000, status: :failed, transaction_type: :credit_card) }

    before do
      [eur_payment, gbp_payment, jpy_payment].each do |payment|
        payment.save! # This will trigger calculate_base_currency_amount via callback
        payment.save!
      end
    end

    scenario "Payment list shows multi-currency amounts" do
      visit payments_path

      expect(page).to have_content("Payments")

      # Should show payments from different currencies
      expect(page).to have_content("€1,000.00").or have_content("1,000.00")
      expect(page).to have_content("£2,000.00").or have_content("2,000.00")
      expect(page).to have_content("¥100,000").or have_content("100,000")
    end

    scenario "Filtering payments by currency" do
      visit payments_path

      fill_in "Search", with: "EUR"
      click_button "Search"

      expect(page).to have_content(eur_client.name)
      expect(page).not_to have_content(gbp_client.name)
      expect(page).not_to have_content(jpy_client.name)
    end

    scenario "Payment summary shows total in base currency" do
      visit payments_path

      within("[data-testid='payment-summary']", wait: 5) do
        # Total should be sum of all payments in USD
        # EUR: 1000 * 1.18 = 1180
        # GBP: 2000 * 1.35 = 2700
        # JPY: 100000 * 0.0068 = 680
        # Total: 4560
        expect(page).to have_content("4,560.00").or have_content("$4,560")
        expect(page).to have_content("USD")
      end
    end
  end

  describe "Payment refunds with currency considerations" do
    let!(:original_payment) { create(:payment, invoice: eur_invoice, amount: 5000.00, status: :paid, transaction_date: 30.days.ago) }

    before do
      original_payment.save! # This will trigger calculate_base_currency_amount via callback
      original_payment.save!
    end

    scenario "Processing refund with different exchange rate" do
      # Mock different rate for refund date
      allow(CurrencyConversionService).to receive(:get_exchange_rate)
        .with("EUR", "USD", Date.current)
        .and_return(1.15) # Lower rate

      visit payment_path(original_payment)

      click_button "Issue Refund"

      within("[data-testid='refund-form']", wait: 5) do
        fill_in "Refund Amount", with: "1000.00"
        fill_in "Reason", with: "Partial refund due to service issue"
        click_button "Process Refund"
      end

      expect(page).to have_content("Refund processed successfully")

      refund = Payment.where(amount: -1000.00).last
      expect(refund.amount).to eq(-1000.00)
      expect(refund.base_currency_amount).to eq(-1150.00) # 1000 * 1.15
      expect(refund.exchange_rate).to eq(1.15) # Different rate from original
      expect(refund.status).to eq("cancelled")
    end
  end

  describe "Batch payment processing with multi-currency" do
    let!(:invoices) do
      [
        create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 1000.00, status: :sent),
        create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 2000.00, status: :sent),
        create(:invoice, client: jpy_client, company: company, currency: "JPY", amount: 300000, status: :sent)
      ]
    end

    before do
      invoices.each do |invoice|
        invoice.save! # This will trigger calculate_base_currency_amount via callback
        invoice.save!
      end
    end

    scenario "Bulk payment recording preserves currency conversions" do
      visit invoices_path

      # Select multiple invoices
      check "select_invoice_#{invoices[0].id}"
      check "select_invoice_#{invoices[1].id}"
      check "select_invoice_#{invoices[2].id}"

      click_button "Bulk Actions"
      select "Record Payments", from: "Action"

      within("[data-testid='bulk-payment-form']", wait: 5) do
        select "Bank Transfer", from: "Payment Method"
        fill_in "Transaction Date", with: Date.current.strftime("%Y-%m-%d")
        click_button "Record Payments"
      end

      expect(page).to have_content("Payments recorded successfully")

      # Verify each payment has correct currency conversion
      payments = Payment.last(3)

      eur_payment = payments.find { |p| p.invoice.currency == "EUR" }
      expect(eur_payment.base_currency_amount).to eq(1180.00) # 1000 * 1.18

      gbp_payment = payments.find { |p| p.invoice.currency == "GBP" }
      expect(gbp_payment.base_currency_amount).to eq(2700.00) # 2000 * 1.35

      jpy_payment = payments.find { |p| p.invoice.currency == "JPY" }
      expect(jpy_payment.base_currency_amount).to eq(2040.00) # 300000 * 0.0068
    end
  end

  describe "Payment analytics and reporting" do
    let!(:payments) do
      dates = [30.days.ago, 20.days.ago, 10.days.ago]
      [
        create(:payment, invoice: eur_invoice, amount: 1000.00, transaction_date: dates[0]),
        create(:payment, invoice: gbp_invoice, amount: 2000.00, transaction_date: dates[1]),
        create(:payment, invoice: jpy_invoice, amount: 100000, transaction_date: dates[2])
      ]
    end

    before do
      payments.each do |payment|
        payment.save! # This will trigger calculate_base_currency_amount via callback
        payment.save!
      end
    end

    scenario "Payment analytics dashboard shows multi-currency insights" do
      visit analytics_payments_path

      within("[data-testid='currency-breakdown']", wait: 5) do
        expect(page).to have_content("EUR")
        expect(page).to have_content("GBP")
        expect(page).to have_content("JPY")

        # Should show base currency totals
        expect(page).to have_content("USD") # Base currency
      end

      within("[data-testid='exchange-rate-impact']", wait: 5) do
        # Should show exchange rate variance or impact
        expect(page).to have_content("Exchange Rate").or have_content("Currency Impact")
      end
    end

    scenario "Payment trends over time show currency-normalized data" do
      visit analytics_payments_path

      within("[data-testid='payment-trends']", wait: 5) do
        # Should show trending data in base currency
        expect(page).to have_content("Payment Trends")
        expect(page).to have_content("USD").or have_content("$")
      end
    end
  end

  describe "Exchange rate impact visualization" do
    scenario "Payment with significant rate difference shows impact" do
      # Create payment with old rate
      old_payment = create(:payment, invoice: eur_invoice, amount: 1000.00, transaction_date: 90.days.ago)

      # Mock very different historical rate
      allow(CurrencyConversionService).to receive(:get_exchange_rate)
        .with("EUR", "USD", 90.days.ago.to_date)
        .and_return(1.10) # Much lower rate

      old_payment.save! # This will trigger calculate_base_currency_amount via callback
      old_payment.save!

      visit payment_path(old_payment)

      within("[data-testid='exchange-rate-impact']", wait: 5) do
        expect(page).to have_content("Exchange Rate Impact").or have_content("Rate Impact")
        expect(page).to have_content("1.10") # Historical rate

        # Should indicate if this was favorable or unfavorable
        current_equivalent = 1000 * 1.18
        historical_equivalent = 1000 * 1.10
        impact = current_equivalent - historical_equivalent

        if impact > 0
          expect(page).to have_content("Unfavorable").or have_content("-")
        else
          expect(page).to have_content("Favorable").or have_content("+")
        end
      end
    end
  end
end
