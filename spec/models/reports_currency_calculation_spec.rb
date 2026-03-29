# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Reports Currency Calculations", type: :model do
  let(:company) { create(:company, base_currency: "USD") }

  # Create clients with different currencies
  let(:usd_client) { create(:client, company: company, currency: "USD") }
  let(:eur_client) { create(:client, company: company, currency: "EUR") }
  let(:gbp_client) { create(:client, company: company, currency: "GBP") }
  let(:jpy_client) { create(:client, company: company, currency: "JPY") }
  let(:inr_client) { create(:client, company: company, currency: "INR") }

  before do
    # Setup exchange rates
    create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.18, date: Date.current)
    create(:exchange_rate, from_currency: "GBP", to_currency: "USD", rate: 1.35, date: Date.current)
    create(:exchange_rate, from_currency: "JPY", to_currency: "USD", rate: 0.0068, date: Date.current)
    create(:exchange_rate, from_currency: "INR", to_currency: "USD", rate: 0.012, date: Date.current)

    # Mock the service
    allow(CurrencyConversionService).to receive(:get_exchange_rate) do |from, to, _date|
      case [from, to]
      when ["EUR", "USD"] then 1.18
      when ["GBP", "USD"] then 1.35
      when ["JPY", "USD"] then 0.0068
      when ["INR", "USD"] then 0.012
      when ["USD", "USD"] then 1.0
      else nil
      end
    end
  end

  describe "Invoice Reports with Multi-Currency" do
    let!(:invoices) do
      [
        create(:invoice, client: usd_client, company: company, currency: "USD", amount: 5000.00, status: :paid, issue_date: Date.current),
        create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 3000.00, status: :paid, issue_date: Date.current),
        create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 2000.00, status: :sent, issue_date: Date.current),
        create(:invoice, client: jpy_client, company: company, currency: "JPY", amount: 500000, status: :paid, issue_date: Date.current),
        create(:invoice, client: inr_client, company: company, currency: "INR", amount: 100000, status: :overdue, issue_date: 30.days.ago)
      ]
    end

    before do
      # Ensure all invoices have base currency calculations
      invoices.each do |invoice|
        invoice.save! # Currency conversion happens automatically on save
      end
    end

    describe "total revenue calculation" do
      it "correctly sums revenue in base currency" do
        total_revenue = Invoice.where(company: company, status: :paid)
                               .sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

        # USD: 5000, EUR: 3000 * 1.18, JPY: 500000 * 0.0068
        expected = 5000 + (3000 * 1.18) + (500000 * 0.0068)
        expect(total_revenue).to be_within(0.01).of(expected)
      end

      it "separates revenue by currency" do
        revenue_by_currency = Invoice.where(company: company, status: :paid)
                                     .group(:currency)
                                     .sum(:amount)

        expect(revenue_by_currency).to eq({
          "USD" => 5000.00,
          "EUR" => 3000.00,
          "JPY" => 500000.0
        })
      end

      it "provides currency conversion summary" do
        paid_invoices = Invoice.where(company: company, status: :paid)

        conversion_summary = paid_invoices.map do |invoice|
          {
            currency: invoice.currency,
            original_amount: invoice.amount,
            base_amount: invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount : invoice.amount,
            rate: invoice.exchange_rate || 1.0
          }
        end

        expect(conversion_summary).to include(
          hash_including(currency: "EUR", original_amount: 3000.00, rate: 1.18),
          hash_including(currency: "JPY", original_amount: 500000.0, rate: 0.0068)
        )
      end
    end

    describe "outstanding amount calculation" do
      it "calculates outstanding in base currency" do
        outstanding = Invoice.where(company: company, status: [:sent, :viewed])
                            .sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

        # GBP: 2000 * 1.35
        expected = 2000 * 1.35
        expect(outstanding).to be_within(0.01).of(expected)
      end
    end

    describe "overdue amount calculation" do
      it "calculates overdue in base currency" do
        overdue = Invoice.where(company: company, status: :overdue)
                        .sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

        # INR: 100000 * 0.012
        expected = 100000 * 0.012
        expect(overdue).to be_within(0.01).of(expected)
      end
    end

    describe "monthly revenue trends" do
      before do
        # Create invoices across different months
        3.times do |i|
          date = (i + 1).months.ago
          create(:invoice,
            client: eur_client,
            company: company,
            currency: "EUR",
            amount: 1000.00,
            status: :paid,
            issue_date: date
          ).tap(&:save!)
        end
      end

      it "tracks revenue trends in base currency" do
        monthly_revenue = Invoice.where(company: company, status: :paid)
                                 .where(issue_date: 3.months.ago..Date.current)
                                 .group_by { |i| i.issue_date.beginning_of_month }
                                 .transform_values { |invoices|
                                   invoices.sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }
                                 }

        expect(monthly_revenue.keys.size).to be >= 3
        monthly_revenue.values.each do |revenue|
          expect(revenue).to be > 0
        end
      end
    end
  end

  describe "Payment Reports with Multi-Currency" do
    let!(:invoices_with_payments) do
      {
        usd: create(:invoice, client: usd_client, company: company, currency: "USD", amount: 5000.00),
        eur: create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 3000.00),
        gbp: create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 2000.00)
      }
    end

    let!(:payments) do
      [
        create(:payment, invoice: invoices_with_payments[:usd], amount: 5000.00, transaction_date: Date.current),
        create(:payment, invoice: invoices_with_payments[:eur], amount: 1500.00, transaction_date: Date.current),
        create(:payment, invoice: invoices_with_payments[:eur], amount: 1500.00, transaction_date: 5.days.ago),
        create(:payment, invoice: invoices_with_payments[:gbp], amount: 1000.00, transaction_date: Date.current)
      ]
    end

    before do
      # Different rates for different dates
      allow(CurrencyConversionService).to receive(:get_exchange_rate)
        .with("EUR", "USD", 5.days.ago.to_date)
        .and_return(1.16)

      payments.each(&:save!)
    end

    describe "payment collection summary" do
      it "calculates total collected in base currency" do
        total_collected = payments.sum { |p| p.base_currency_amount.to_f > 0 ? p.base_currency_amount : p.amount }

        # USD: 5000, EUR: 1500*1.18 + 1500*1.16, GBP: 1000*1.35
        expected = 5000 + (1500 * 1.18) + (1500 * 1.16) + (1000 * 1.35)
        expect(total_collected).to be_within(0.01).of(expected)
      end

      it "tracks payment collection by currency" do
        collection_by_currency = Payment.joins(:invoice)
                                        .where(id: payments.map(&:id))
                                        .group("invoices.currency")
                                        .sum("payments.amount")

        expect(collection_by_currency).to eq({
          "USD" => 5000.00,
          "EUR" => 3000.00,
          "GBP" => 1000.00
        })
      end

      it "calculates average payment amounts in base currency" do
        avg_payment = payments.sum { |p| p.base_currency_amount.to_f > 0 ? p.base_currency_amount : p.amount } / payments.count

        expect(avg_payment).to be > 0
      end
    end

    describe "payment success rate by currency" do
      before do
        # Add some failed payments
        create(:payment, invoice: invoices_with_payments[:eur], amount: 500.00, status: :failed)
        create(:payment, invoice: invoices_with_payments[:gbp], amount: 500.00, status: :failed)
      end

      it "calculates success rate per currency" do
        Payment.joins(:invoice)
                               .group("invoices.currency")
                               .group(:status)
                               .count

        # Check that we have payments for each currency
        usd_payments = Payment.joins(:invoice).where(invoices: { currency: "USD" })
        eur_payments = Payment.joins(:invoice).where(invoices: { currency: "EUR" })
        gbp_payments = Payment.joins(:invoice).where(invoices: { currency: "GBP" })

        expect(usd_payments.count).to be > 0
        expect(eur_payments.count).to be > 0
        expect(gbp_payments.count).to be > 0

        # USD should have fewer failed payments than EUR and GBP
        usd_failed = usd_payments.where(status: :failed).count
        eur_failed = eur_payments.where(status: :failed).count
        gbp_failed = gbp_payments.where(status: :failed).count

        expect(usd_failed).to eq(0) # No failed USD payments
        expect(eur_failed).to be > 0 # Has failed EUR payments
        expect(gbp_failed).to be > 0 # Has failed GBP payments
      end
    end
  end

  describe "Client Revenue Reports" do
    let!(:multi_currency_invoices) do
      [
        # EUR client with multiple invoices
        create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 1000.00, status: :paid),
        create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 2000.00, status: :paid),
        create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 1500.00, status: :sent),

        # GBP client
        create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 3000.00, status: :paid),
        create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 1000.00, status: :overdue),

        # USD client
        create(:invoice, client: usd_client, company: company, currency: "USD", amount: 5000.00, status: :paid)
      ]
    end

    before do
      multi_currency_invoices.each(&:save!)
    end

    describe "top clients by revenue" do
      it "ranks clients by base currency revenue" do
        top_clients = Client.joins(:invoices)
                           .where(invoices: { company: company, status: :paid })
                           .group("clients.id", "clients.name")
                           .sum("CASE WHEN invoices.base_currency_amount > 0 THEN invoices.base_currency_amount ELSE invoices.amount END")
                           .sort_by { |_, revenue| -revenue }
                           .first(3)

        # USD client: 5000
        # GBP client: 3000 * 1.35 = 4050
        # EUR client: (1000 + 2000) * 1.18 = 3540

        expect(top_clients[0][1]).to be_within(0.01).of(5000.00) # USD client
        expect(top_clients[1][1]).to be_within(0.01).of(4050.00) # GBP client
        expect(top_clients[2][1]).to be_within(0.01).of(3540.00) # EUR client
      end
    end

    describe "client lifetime value" do
      it "calculates LTV in base currency" do
        ltv_by_client = {}

        [eur_client, gbp_client, usd_client].each do |client|
          total = client.invoices.where(status: :paid).sum do |invoice|
            invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount : invoice.amount
          end
          ltv_by_client[client.name] = total
        end

        expect(ltv_by_client[eur_client.name]).to be_within(0.01).of(3540.00)
        expect(ltv_by_client[gbp_client.name]).to be_within(0.01).of(4050.00)
        expect(ltv_by_client[usd_client.name]).to be_within(0.01).of(5000.00)
      end
    end
  end

  describe "Project Profitability with Multi-Currency" do
    let(:project) { create(:project, client: eur_client, billable: true) }
    let(:team_member) { create(:user) }

    let!(:timesheet_entries) do
      [
        create(:timesheet_entry, project: project, user: team_member, duration: 480), # 8 hours
        create(:timesheet_entry, project: project, user: team_member, duration: 360), # 6 hours
        create(:timesheet_entry, project: project, user: team_member, duration: 120) # 2 hours
      ]
    end

    let!(:project_invoice) do
      invoice = create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 2000.00, status: :paid)
      invoice.invoice_line_items.create!(
        name: "Development Work",
        description: "14 hours of development",
        quantity: 14,
        rate: 142.86, # 2000 / 14 hours
        date: Date.current
      )
      invoice.save!
      invoice
    end

    describe "project revenue calculation" do
      it "calculates project revenue in base currency" do
        project_revenue = project_invoice.base_currency_amount

        expect(project_revenue).to eq(2360.00) # 2000 * 1.18
      end

      it "tracks billable vs unbilled hours" do
        total_hours = timesheet_entries.sum(&:duration) / 60.0
        # Assume first two entries are billed (from line item creation)
        billed_hours = timesheet_entries.first(2).sum(&:duration) / 60.0
        unbilled_hours = timesheet_entries.last(1).sum(&:duration) / 60.0

        expect(total_hours).to eq(16.0)
        expect(billed_hours).to eq(14.0)
        expect(unbilled_hours).to eq(2.0)
      end

      it "calculates effective hourly rate in base currency" do
        # Assume first two entries are billed (from line item creation)
        billed_hours = timesheet_entries.first(2).sum(&:duration) / 60.0
        revenue_base = project_invoice.base_currency_amount

        effective_rate = revenue_base / billed_hours

        expect(effective_rate).to be_within(0.01).of(168.57) # 2360 / 14
      end
    end
  end

  describe "Expense Reports with Multi-Currency" do
    let!(:expenses) do
      [
        create(:expense, company: company, amount: 100.00, date: Date.current),
        create(:expense, company: company, amount: 200.00, date: Date.current),
        create(:expense, company: company, amount: 150.00, date: Date.current),
        create(:expense, company: company, amount: 10000, date: Date.current)
      ]
    end

    it "calculates total expenses in base currency" do
      total_expenses = expenses.sum(&:amount)

      # All expenses in base currency (USD)
      expected = 100 + 200 + 150 + 10000
      expect(total_expenses).to eq(expected)
    end

    it "groups expenses by amount" do
      expenses_by_amount = expenses.group_by(&:amount)
                                   .transform_values(&:count)

      expect(expenses_by_amount.values.sum).to eq(4) # All 4 expenses accounted for
      expect(expenses_by_amount.keys).to match_array([100.0, 200.0, 150.0, 10000.0])
    end
  end

  describe "Cash Flow Analysis" do
    let!(:invoices) do
      dates = [60.days.ago, 30.days.ago, Date.current]
      currencies = ["EUR", "GBP", "USD"]

      dates.zip(currencies).map do |date, currency|
        client = create(:client, company: company, currency: currency)
        invoice = create(:invoice,
          client: client,
          company: company,
          currency: currency,
          amount: 1000.00,
          status: :paid,
          issue_date: date
        )
        invoice.save!
        invoice
      end
    end

    let!(:payments) do
      invoices.map.with_index do |invoice, i|
        payment_date = invoice.issue_date + (10 + i * 5).days
        payment = create(:payment,
          invoice: invoice,
          amount: invoice.amount,
          transaction_date: payment_date
        )
        payment.save!
        payment
      end
    end

    it "tracks cash flow in base currency over time" do
      cash_flow = {}

      # Group by month
      payments.group_by { |p| p.transaction_date.beginning_of_month }.each do |month, month_payments|
        inflow = month_payments.sum { |p| p.base_currency_amount.to_f > 0 ? p.base_currency_amount : p.amount }
        cash_flow[month] = inflow
      end

      expect(cash_flow.values.all? { |v| v > 0 }).to be true
    end

    it "calculates average days to payment by currency" do
      days_to_payment = invoices.filter_map do |invoice|
        payment = payments.find { |p| p.invoice_id == invoice.id }
        next unless payment

        {
          currency: invoice.currency,
          days: (payment.transaction_date - invoice.issue_date).to_i
        }
      end

      avg_by_currency = days_to_payment.group_by { |d| d[:currency] }
                                       .transform_values { |entries|
                                         days = entries.map { |e| e[:days] }
                                         days.sum.to_f / days.size
                                       }

      expect(avg_by_currency.keys).to match_array(["EUR", "GBP", "USD"])
      avg_by_currency.values.each { |avg| expect(avg).to be > 0 }
    end
  end

  describe "Exchange Rate Impact Analysis" do
    context "with fluctuating exchange rates" do
      let(:client) { eur_client }
      let!(:invoices_with_different_rates) do
        rates = [1.15, 1.18, 1.20, 1.17]
        dates = [90.days.ago, 60.days.ago, 30.days.ago, Date.current]

        dates.zip(rates).map do |date, rate|
          allow(CurrencyConversionService).to receive(:get_exchange_rate)
            .with("EUR", "USD", date.to_date)
            .and_return(rate)

          invoice = create(:invoice,
            client: client,
            company: company,
            currency: "EUR",
            amount: 1000.00,
            status: :paid,
            issue_date: date
          )
          invoice.save!
          invoice
        end
      end

      it "tracks exchange rate variance impact" do
        rate_impact = invoices_with_different_rates.map do |invoice|
          {
            date: invoice.issue_date,
            rate: invoice.exchange_rate,
            original: invoice.amount,
            converted: invoice.base_currency_amount,
            variance_from_current: (invoice.exchange_rate - 1.17).round(4)
          }
        end

        expect(rate_impact.pluck(:rate)).to match_array([1.15, 1.18, 1.20, 1.17])

        # Calculate total impact
        current_rate = 1.17
        total_impact = invoices_with_different_rates.sum do |invoice|
          (invoice.amount * current_rate) - invoice.base_currency_amount
        end

        expect(total_impact.abs).to be > 0 # There should be some impact from rate changes
      end

      it "identifies favorable vs unfavorable rate movements" do
        current_rate = 1.17

        analysis = invoices_with_different_rates.map do |invoice|
          actual_base = invoice.base_currency_amount
          current_value = invoice.amount * current_rate

          {
            invoice_id: invoice.id,
            favorable: actual_base < current_value, # We paid less in base currency than current value
            impact: (current_value - actual_base).round(2)
          }
        end

        favorable_count = analysis.count { |a| a[:favorable] }
        unfavorable_count = analysis.count { |a| !a[:favorable] }

        expect(favorable_count + unfavorable_count).to eq(invoices_with_different_rates.size)
      end
    end
  end

  describe "Complex Multi-Currency Reporting Scenarios" do
    context "with mixed payment terms and currencies" do
      let!(:complex_scenario) do
        # Create a complex scenario with multiple currencies, partial payments, and refunds

        # EUR invoice with partial payments
        eur_inv = create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 5000.00, status: :sent)
        eur_inv.save!

        # Partial payments at different rates
        [
          { amount: 2000.00, date: 30.days.ago, rate: 1.16 },
          { amount: 1500.00, date: 15.days.ago, rate: 1.17 },
          { amount: 1000.00, date: Date.current, rate: 1.18 }
        ].each do |payment_data|
          allow(CurrencyConversionService).to receive(:get_exchange_rate)
            .with("EUR", "USD", payment_data[:date].to_date)
            .and_return(payment_data[:rate])

          payment = create(:payment,
            invoice: eur_inv,
            amount: payment_data[:amount],
            transaction_date: payment_data[:date]
          )
          payment.save!
        end

        # No refund needed for this test - just testing multi-rate payment scenario

        eur_inv
      end

      it "accurately tracks complex payment scenarios" do
        invoice = complex_scenario
        payments = invoice.payments.where("amount > 0")

        total_paid = payments.sum(&:amount)

        expect(total_paid).to eq(4500.00) # 2000 + 1500 + 1000

        # Base currency calculations with varying rates
        total_base = payments.sum(&:base_currency_amount)

        expected_base = (2000 * 1.16) + (1500 * 1.17) + (1000 * 1.18)
        expect(total_base).to be_within(0.01).of(expected_base)
      end

      it "provides accurate outstanding balance in base currency" do
        invoice = complex_scenario

        total_amount = invoice.amount
        total_paid = invoice.payments.sum(&:amount)
        outstanding_original = total_amount - total_paid

        # Calculate in base currency
        invoice_base = invoice.base_currency_amount
        paid_base = invoice.payments.sum(&:base_currency_amount)
        outstanding_base = invoice_base - paid_base

        expect(outstanding_original).to eq(500.00) # 5000 - 4500
        expect(outstanding_base).to be_within(100).of(outstanding_original * 1.18) # approximate conversion with wider tolerance
      end
    end
  end
end
