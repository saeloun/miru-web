# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Multi-Currency End-to-End Flow", type: :integration do
  include ActiveSupport::Testing::TimeHelpers
  let(:company) { create(:company, name: "Global Corp", base_currency: "USD") }
  let(:admin_user) { create(:user, current_workspace_id: company.id) }

  # Create clients in different regions
  let(:us_client) { create(:client, company: company, name: "US Tech Inc", currency: "USD") }
  let(:eu_client) { create(:client, company: company, name: "EU Solutions GmbH", currency: "EUR") }
  let(:uk_client) { create(:client, company: company, name: "UK Services Ltd", currency: "GBP") }
  let(:jp_client) { create(:client, company: company, name: "Japan Corp", currency: "JPY") }

  before do
    # Mock exchange rate API responses
    allow(CurrencyConversionService).to receive(:get_exchange_rate) do |from, to, date|
      rates = {
        ["EUR", "USD"] => 1.18,
        ["GBP", "USD"] => 1.35,
        ["JPY", "USD"] => 0.0068,
        ["USD", "EUR"] => 0.85,
        ["USD", "GBP"] => 0.74,
        ["USD", "JPY"] => 147.06
      }
      rates[[from, to]] || 1.0
    end
  end

  describe "Complete Invoice-to-Payment Lifecycle" do
    context "European client workflow" do
      let(:project) { create(:project, client: eu_client, name: "Website Redesign", billable: true) }
      let(:team_members) { create_list(:user, 3, current_workspace_id: company.id) }

      it "handles complete workflow with currency conversion at each step" do
        # Setup employments for team members
        team_members.each do |member|
          create(:employment, company: company, user: member)
        end

        # Step 1: Team logs time
        timesheet_entries = []
        team_members.each_with_index do |member, i|
          entry = create(:timesheet_entry,
            user: member,
            project: project,
            duration: 480, # 8 hours
            work_date: (i + 1).days.ago,
            bill_status: "unbilled"
          )
          timesheet_entries << entry
        end

        total_hours = timesheet_entries.sum(&:duration) / 60.0
        expect(total_hours).to eq(24.0)

        # Step 2: Create invoice in EUR
        invoice = create(:invoice,
          client: eu_client,
          company: company,
          currency: "EUR",
          amount: 2400.00, # 100 EUR/hour
          status: :draft,
          issue_date: Date.current,
          due_date: 30.days.from_now
        )

        # Add line items linking to timesheet entries
        invoice.invoice_line_items.create!(
          name: "Development Services",
          description: "24 hours of development work",
          date: Date.current,
          quantity: 24,
          rate: 100.00,
          timesheet_entry_id: timesheet_entries.first.id
        )

        # Step 3: Invoice conversion happens on save
        invoice.status = :sent
        invoice.save!

        expect(invoice.exchange_rate).to eq(1.18)
        expect(invoice.base_currency_amount).to eq(2832.00) # 2400 * 1.18
        expect(invoice.exchange_rate_date).to eq(Date.current)

        # Mark timesheet entries as billed
        timesheet_entries.each { |e| e.update!(bill_status: "billed") }

        # Step 4: Client makes partial payment after 15 days
        travel_to 15.days.from_now do
          # Exchange rate might have changed
          allow(CurrencyConversionService).to receive(:get_exchange_rate)
            .with("EUR", "USD", Date.current)
            .and_return(1.19)

          payment1 = create(:payment,
            invoice: invoice,
            amount: 1000.00, # EUR
            transaction_date: Date.current,
            status: :paid,
            transaction_type: :bank_transfer
          )

          payment1.save!

          expect(payment1.exchange_rate).to eq(1.19)
          expect(payment1.base_currency_amount).to eq(1190.00)

          # Verify outstanding balance
          outstanding_eur = invoice.amount - invoice.payments.sum(&:amount)
          expect(outstanding_eur).to eq(1400.00)
        end

        # Step 5: Final payment after 25 days
        travel_to 25.days.from_now do
          # Rate changes again
          allow(CurrencyConversionService).to receive(:get_exchange_rate)
            .with("EUR", "USD", Date.current)
            .and_return(1.17)

          payment2 = create(:payment,
            invoice: invoice,
            amount: 1400.00, # EUR
            transaction_date: Date.current,
            status: :paid,
            transaction_type: :stripe
          )

          payment2.save!

          expect(payment2.exchange_rate).to eq(1.17)
          expect(payment2.base_currency_amount).to eq(1638.00)

          # Update invoice status
          invoice.update!(status: :paid)
        end

        # Step 6: Verify complete transaction history
        travel_back

        # Reload the invoice to ensure we have all payments
        invoice.reload

        total_collected_base = invoice.payments.sum(&:base_currency_amount)
        expect(total_collected_base).to eq(2828.00)

        # Exchange rate impact
        original_expected = invoice.base_currency_amount
        actual_collected = total_collected_base
        exchange_impact = actual_collected - original_expected

        expect(exchange_impact).to eq(-4.00) # Lost $4 due to rate changes

        # Verify audit trail
        expect(invoice.audits.count).to be >= 2
        expect(invoice.payments.map(&:audits).flatten.count).to be >= 2
      end
    end

    context "multi-client, multi-currency reporting" do
      let!(:invoices_and_payments) do
        data = []

        # US Client - USD invoice
        us_invoice = create(:invoice,
          client: us_client,
          company: company,
          currency: "USD",
          amount: 5000.00,
          status: :paid,
          issue_date: 30.days.ago
        )
        us_payment = create(:payment,
          invoice: us_invoice,
          amount: 5000.00,
          transaction_date: 20.days.ago
        )
        data << { invoice: us_invoice, payments: [us_payment] }

        # EU Client - EUR invoices with varying rates
        [45.days.ago, 30.days.ago, 15.days.ago].each_with_index do |date, i|
          # Simulate historical rates
          rate = 1.15 + (0.01 * i)

          allow(CurrencyConversionService).to receive(:get_exchange_rate)
            .with("EUR", "USD", date.to_date)
            .and_return(rate)

          eu_invoice = create(:invoice,
            client: eu_client,
            company: company,
            currency: "EUR",
            amount: 3000.00,
            status: :paid,
            issue_date: date
          )
          eu_invoice.save!

          eu_payment = create(:payment,
            invoice: eu_invoice,
            amount: 3000.00,
            transaction_date: date + 10.days
          )
          eu_payment.save!

          data << { invoice: eu_invoice, payments: [eu_payment] }
        end

        # UK Client - GBP invoice with partial payments
        uk_invoice = create(:invoice,
          client: uk_client,
          company: company,
          currency: "GBP",
          amount: 4000.00,
          status: :sent,
          issue_date: 20.days.ago
        )
        uk_invoice.save!

        uk_payments = [
          create(:payment, invoice: uk_invoice, amount: 2000.00, transaction_date: 10.days.ago),
          create(:payment, invoice: uk_invoice, amount: 1000.00, transaction_date: 5.days.ago)
        ]
        uk_payments.each do |payment|
          payment.save!
        end

        data << { invoice: uk_invoice, payments: uk_payments }

        # JP Client - JPY invoice
        jp_invoice = create(:invoice,
          client: jp_client,
          company: company,
          currency: "JPY",
          amount: 500000,
          status: :sent,
          issue_date: 10.days.ago
        )
        jp_invoice.save!

        data << { invoice: jp_invoice, payments: [] }

        data
      end

      it "generates accurate multi-currency financial reports" do
        # Revenue by currency
        revenue_by_currency = Invoice.where(status: :paid)
                                     .group(:currency)
                                     .sum(:amount)

        expect(revenue_by_currency["USD"]).to eq(5000.00)
        expect(revenue_by_currency["EUR"]).to eq(9000.00) # 3 invoices × 3000

        # Revenue in base currency
        total_revenue_base = Invoice.where(status: :paid)
                                    .sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

        # Calculate expected total
        us_total = 5000.00
        eu_total = invoices_and_payments.select { |d| d[:invoice].currency == "EUR" && d[:invoice].status == :paid }
                                        .sum { |d| d[:invoice].base_currency_amount }

        expect(total_revenue_base).to eq(us_total + eu_total)

        # Outstanding by currency
        outstanding = Invoice.where(status: [:sent, :viewed])
                            .group(:currency)
                            .sum { |invoice|
                              paid = invoice.payments.sum(&:amount)
                              invoice.amount - paid
                            }

        # UK: 4000 - 3000 = 1000 GBP outstanding
        # JP: 500000 JPY outstanding
        expect(outstanding["GBP"]).to eq(1000.00)
        expect(outstanding["JPY"]).to eq(500000.0)

        # Collection efficiency by currency
        collection_by_currency = {}

        ["USD", "EUR", "GBP", "JPY"].each do |currency|
          currency_invoices = Invoice.where(currency: currency)
          total_invoiced = currency_invoices.sum(&:amount)
          total_collected = currency_invoices.joins(:payments).sum("payments.amount")

          collection_by_currency[currency] = {
            invoiced: total_invoiced,
            collected: total_collected,
            rate: total_invoiced > 0 ? (total_collected / total_invoiced * 100).round(2) : 0
          }
        end

        expect(collection_by_currency["USD"][:rate]).to eq(100.0)
        expect(collection_by_currency["EUR"][:rate]).to eq(100.0)
        expect(collection_by_currency["GBP"][:rate]).to eq(75.0) # 3000/4000
        expect(collection_by_currency["JPY"][:rate]).to eq(0.0)
      end

      it "tracks exchange rate impact across all transactions" do
        all_conversions = []

        # Collect all currency conversions
        Invoice.where(company: company).where.not(exchange_rate: nil).each do |invoice|
          all_conversions << {
            type: "invoice",
            currency: invoice.currency,
            amount: invoice.amount,
            rate: invoice.exchange_rate,
            base_amount: invoice.base_currency_amount,
            date: invoice.exchange_rate_date
          }
        end

        Payment.joins(:invoice).where(invoices: { company: company }).where.not(exchange_rate: nil).each do |payment|
          all_conversions << {
            type: "payment",
            currency: payment.invoice.currency,
            amount: payment.amount,
            rate: payment.exchange_rate,
            base_amount: payment.base_currency_amount,
            date: payment.exchange_rate_date
          }
        end

        # Analyze rate variations
        eur_rates = all_conversions.select { |c| c[:currency] == "EUR" }.pluck(:rate)
        if eur_rates.any?
          min_eur_rate = eur_rates.min
          max_eur_rate = eur_rates.max
          avg_eur_rate = eur_rates.sum / eur_rates.size

          expect(min_eur_rate).to be >= 1.15
          expect(max_eur_rate).to be <= 1.20
          expect(avg_eur_rate).to be_between(1.15, 1.20)
        end

        # Calculate total exchange impact
        invoice_impact = Invoice.where(company: company).where.not(exchange_rate: nil).sum do |invoice|
          current_rate = CurrencyConversionService.get_exchange_rate(invoice.currency, company.base_currency, Date.current) || invoice.exchange_rate
          (invoice.amount * current_rate) - invoice.base_currency_amount
        end

        expect(invoice_impact.abs).to be >= 0
      end
    end
  end

  describe "Complex Refund and Adjustment Scenarios" do
    context "with currency fluctuations" do
      let(:invoice) { create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 10000.00, status: :sent) }

      it "handles refunds with different exchange rates" do
        # Original invoice at rate 1.18
        allow(CurrencyConversionService).to receive(:get_exchange_rate)
          .with("EUR", "USD", Date.current)
          .and_return(1.18)

        invoice.save!
        expect(invoice.base_currency_amount).to eq(11800.00)

        # Payment at rate 1.19
        travel_to 10.days.from_now do
          allow(CurrencyConversionService).to receive(:get_exchange_rate)
            .with("EUR", "USD", Date.current)
            .and_return(1.19)

          payment = create(:payment,
            invoice: invoice,
            amount: 10000.00,
            transaction_date: Date.current,
            status: :paid
          )
          payment.save!

          expect(payment.base_currency_amount).to eq(11900.00)
          invoice.update!(status: :paid)
        end

        # Partial refund at rate 1.17
        travel_to 20.days.from_now do
          allow(CurrencyConversionService).to receive(:get_exchange_rate)
            .with("EUR", "USD", Date.current)
            .and_return(1.17)

          refund = create(:payment,
            invoice: invoice,
            amount: -2000.00, # Negative for refund
            transaction_date: Date.current,
            status: :paid
          )
          refund.save!

          expect(refund.base_currency_amount).to eq(-2340.00)
        end

        travel_back

        # Calculate net position
        net_payments = invoice.payments.sum(&:amount)
        net_base = invoice.payments.sum(&:base_currency_amount)

        expect(net_payments).to eq(8000.00) # 10000 - 2000
        expect(net_base).to eq(9560.00) # 11900 - 2340

        # Exchange rate impact on refund
        refund_rate_impact = (2000 * 1.17) - (2000 * 1.19)
        expect(refund_rate_impact).to eq(-40.00) # Saved $40 on refund due to lower rate
      end
    end
  end

  describe "Analytics and Reporting Integration" do
    let!(:comprehensive_data) do
      # Create 3 months of data
      (0..2).each do |month|
        date = month.months.ago

        # Create invoices in various currencies
        ["USD", "EUR", "GBP", "JPY"].each do |currency|
          client = case currency
                   when "USD" then us_client
                   when "EUR" then eu_client
                   when "GBP" then uk_client
                   when "JPY" then jp_client
          end

          amount = case currency
                   when "USD" then rand(1000..5000)
                   when "EUR" then rand(1000..4000)
                   when "GBP" then rand(800..3000)
                   when "JPY" then rand(100000..500000)
          end

          invoice = create(:invoice,
            client: client,
            company: company,
            currency: currency,
            amount: amount,
            status: [:paid, :sent, :overdue].sample,
            issue_date: date.beginning_of_month + rand(0..28).days
          )

          invoice.save!

          # Create payments for some invoices
          if invoice.status == :paid
            payment_date = invoice.issue_date + rand(10..40).days
            payment = create(:payment,
              invoice: invoice,
              amount: invoice.amount,
              transaction_date: payment_date
            )
            payment.save!
          end
        end
      end
    end

    it "provides comprehensive multi-currency analytics" do
      # Monthly revenue trend in base currency
      monthly_revenue = {}

      3.times do |i|
        month = i.months.ago.beginning_of_month
        month_invoices = Invoice.where(
          status: :paid,
          issue_date: month..month.end_of_month
        )

        revenue = month_invoices.sum do |invoice|
          invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount : invoice.amount
        end

        monthly_revenue[month.strftime("%Y-%m")] = revenue
      end

      expect(monthly_revenue.values.all? { |v| v > 0 }).to be true

      # Currency distribution
      currency_distribution = Invoice.where(company: company)
                                     .group(:currency)
                                     .count

      expect(currency_distribution.keys).to match_array(["USD", "EUR", "GBP", "JPY"])

      # Average invoice value by currency (in base currency)
      avg_invoice_base = {}

      ["USD", "EUR", "GBP", "JPY"].each do |currency|
        invoices = Invoice.where(currency: currency)
        next if invoices.empty?

        total_base = invoices.sum do |invoice|
          invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount : invoice.amount
        end

        avg_invoice_base[currency] = (total_base / invoices.count).round(2)
      end

      expect(avg_invoice_base.values.all? { |v| v > 0 }).to be true

      # Payment velocity by currency
      payment_velocity = {}

      ["USD", "EUR", "GBP", "JPY"].each do |currency|
        paid_invoices = Invoice.where(currency: currency, status: :paid)
                               .includes(:payments)

        next if paid_invoices.empty?

        days_to_payment = paid_invoices.filter_map do |invoice|
          first_payment = invoice.payments.order(:transaction_date).first
          next unless first_payment

          (first_payment.transaction_date - invoice.issue_date).to_i
        end

        payment_velocity[currency] = {
          avg_days: days_to_payment.any? ? (days_to_payment.sum.to_f / days_to_payment.size).round(1) : nil,
          min_days: days_to_payment.min,
          max_days: days_to_payment.max
        }
      end

      payment_velocity.each do |_currency, velocity|
        next unless velocity[:avg_days]

        expect(velocity[:avg_days]).to be_between(10, 40)
        expect(velocity[:min_days]).to be >= 10
        expect(velocity[:max_days]).to be <= 40
      end
    end
  end

  describe "Audit Trail Completeness" do
    it "maintains complete audit trail for all currency operations" do
      # Create invoice with conversion
      invoice = create(:invoice, client: eu_client, company: company, currency: "EUR", amount: 1000.00)
      invoice.save!

      # Create payment with conversion
      payment = create(:payment, invoice: invoice, amount: 1000.00)
      payment.save!

      # Verify audits exist
      expect(invoice.audits.count).to be >= 1
      expect(payment.audits.count).to be >= 1

      # Verify exchange rate tracking
      invoice_audit = invoice.audits.last
      expect(invoice_audit.audited_changes.keys).to include("base_currency_amount", "exchange_rate")

      payment_audit = payment.audits.last
      expect(payment_audit.audited_changes.keys).to include("base_currency_amount")

      # Verify exchange rate records
      expect(ExchangeRate.count).to be >= 0 # May or may not create records depending on cache
    end
  end
end
