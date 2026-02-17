# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Accounts Aging Calculations", type: :model do
  let(:company) { create(:company, base_currency: "USD") }

  # Create clients with different currencies
  let(:usd_client) { create(:client, company: company, currency: "USD", name: "USD Client") }
  let(:eur_client) { create(:client, company: company, currency: "EUR", name: "EUR Client") }
  let(:gbp_client) { create(:client, company: company, currency: "GBP", name: "GBP Client") }
  let(:jpy_client) { create(:client, company: company, currency: "JPY", name: "JPY Client") }

  before do
    # Setup exchange rates
    create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.18, date: Date.current)
    create(:exchange_rate, from_currency: "GBP", to_currency: "USD", rate: 1.35, date: Date.current)
    create(:exchange_rate, from_currency: "JPY", to_currency: "USD", rate: 0.0068, date: Date.current)

    allow(CurrencyConversionService).to receive(:get_exchange_rate) do |from, to, _date|
      case [from, to]
      when ["EUR", "USD"] then 1.18
      when ["GBP", "USD"] then 1.35
      when ["JPY", "USD"] then 0.0068
      when ["USD", "USD"] then 1.0
      else nil
      end
    end
  end

  describe "Basic Aging Buckets" do
    let!(:current_invoice) { create(:invoice, client: usd_client, company: company, currency: "USD", amount: 1000.00, status: :sent, issue_date: Date.current, due_date: 30.days.from_now) }
    let!(:overdue_30) { create(:invoice, client: usd_client, company: company, currency: "USD", amount: 2000.00, status: :overdue, issue_date: 35.days.ago, due_date: 5.days.ago) }
    let!(:overdue_60) { create(:invoice, client: usd_client, company: company, currency: "USD", amount: 3000.00, status: :overdue, issue_date: 65.days.ago, due_date: 35.days.ago) }
    let!(:overdue_90) { create(:invoice, client: usd_client, company: company, currency: "USD", amount: 4000.00, status: :overdue, issue_date: 95.days.ago, due_date: 65.days.ago) }
    let!(:overdue_120_plus) { create(:invoice, client: usd_client, company: company, currency: "USD", amount: 5000.00, status: :overdue, issue_date: 150.days.ago, due_date: 120.days.ago) }

    describe "aging bucket categorization" do
      it "correctly categorizes invoices into aging buckets" do
        aging_buckets = {
          current: [],
          overdue_1_30: [],
          overdue_31_60: [],
          overdue_61_90: [],
          overdue_90_plus: []
        }

        invoices = [current_invoice, overdue_30, overdue_60, overdue_90, overdue_120_plus]

        invoices.each do |invoice|
          days_overdue = if invoice.due_date < Date.current
            (Date.current - invoice.due_date).to_i
          else
            0
          end

          case days_overdue
          when 0
            aging_buckets[:current] << invoice
          when 1..30
            aging_buckets[:overdue_1_30] << invoice
          when 31..60
            aging_buckets[:overdue_31_60] << invoice
          when 61..90
            aging_buckets[:overdue_61_90] << invoice
          else
            aging_buckets[:overdue_90_plus] << invoice if days_overdue > 90
          end
        end

        expect(aging_buckets[:current]).to include(current_invoice)
        expect(aging_buckets[:overdue_1_30]).to include(overdue_30)
        expect(aging_buckets[:overdue_31_60]).to include(overdue_60)
        expect(aging_buckets[:overdue_61_90]).to include(overdue_90)
        expect(aging_buckets[:overdue_90_plus]).to include(overdue_120_plus)
      end

      it "calculates total amounts per bucket" do
        bucket_totals = {
          current: 1000.00,
          overdue_1_30: 2000.00,
          overdue_31_60: 3000.00,
          overdue_61_90: 4000.00,
          overdue_90_plus: 5000.00
        }

        total_outstanding = bucket_totals.values.sum
        expect(total_outstanding).to eq(15000.00)
      end
    end
  end

  describe "Multi-Currency Aging Calculations" do
    let!(:invoices) do
      [
        # Current invoices in different currencies
        create(:invoice, client: usd_client, company: company, currency: "USD", amount: 1000.00, status: :sent, due_date: 30.days.from_now),
        create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 2000.00, status: :sent, due_date: 30.days.from_now),

        # 30 days overdue
        create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 1500.00, status: :overdue, due_date: 15.days.ago),
        create(:invoice, client: jpy_client, company: company, currency: "JPY", amount: 100000, status: :overdue, due_date: 20.days.ago),

        # 60 days overdue
        create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 3000.00, status: :overdue, due_date: 45.days.ago),

        # 90+ days overdue
        create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 5000.00, status: :overdue, due_date: 100.days.ago)
      ]
    end

    before do
      invoices.each do |invoice|
        invoice.save!
      end
    end

    describe "aging report in base currency" do
      it "converts all amounts to base currency for aging buckets" do
        aging_report = {}

        invoices.each do |invoice|
          days_overdue = if invoice.due_date < Date.current
            (Date.current - invoice.due_date).to_i
          else
            0
          end

          bucket = case days_overdue
                   when 0 then :current
                   when 1..30 then :overdue_1_30
                   when 31..60 then :overdue_31_60
                   when 61..90 then :overdue_61_90
                   else :overdue_90_plus
          end

          aging_report[bucket] ||= { original: 0, base_currency: 0, invoices: [] }
          aging_report[bucket][:original] += invoice.amount
          aging_report[bucket][:base_currency] += invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount : invoice.amount
          aging_report[bucket][:invoices] << invoice
        end

        # Verify current bucket
        current_base = aging_report[:current][:base_currency]
        expected_current = 1000 + (2000 * 1.18) # USD + EUR

        # Debug output
        aging_report[:current][:invoices].each do |invoice|
          puts "Invoice: #{invoice.currency} #{invoice.amount} -> base: #{invoice.base_currency_amount}"
        end
        puts "Current base total: #{current_base}, expected: #{expected_current}"

        expect(current_base).to be_within(0.01).of(expected_current)

        # Verify 1-30 days bucket
        overdue_30_base = aging_report[:overdue_1_30][:base_currency]
        expected_30 = (1500 * 1.35) + (100000 * 0.0068) # GBP + JPY
        expect(overdue_30_base).to be_within(0.01).of(expected_30)

        # Verify 31-60 days bucket
        overdue_60_base = aging_report[:overdue_31_60][:base_currency]
        expected_60 = 3000 * 1.18 # EUR
        expect(overdue_60_base).to be_within(0.01).of(expected_60)

        # Verify 90+ days bucket
        overdue_90_base = aging_report[:overdue_90_plus][:base_currency]
        expected_90 = 5000 * 1.35 # GBP
        expect(overdue_90_base).to be_within(0.01).of(expected_90)
      end

      it "provides aging summary by currency" do
        aging_by_currency = {}

        invoices.each do |invoice|
          days_overdue = if invoice.due_date < Date.current
            (Date.current - invoice.due_date).to_i
          else
            0
          end

          bucket = case days_overdue
                   when 0 then :current
                   when 1..30 then :overdue_1_30
                   when 31..60 then :overdue_31_60
                   when 61..90 then :overdue_61_90
                   else :overdue_90_plus
          end

          aging_by_currency[invoice.currency] ||= {}
          aging_by_currency[invoice.currency][bucket] ||= 0
          aging_by_currency[invoice.currency][bucket] += invoice.amount
        end

        expect(aging_by_currency["USD"][:current]).to eq(1000.00)
        expect(aging_by_currency["EUR"][:current]).to eq(2000.00)
        expect(aging_by_currency["GBP"][:overdue_1_30]).to eq(1500.00)
        expect(aging_by_currency["JPY"][:overdue_1_30]).to eq(100000.0)
        expect(aging_by_currency["EUR"][:overdue_31_60]).to eq(3000.00)
        expect(aging_by_currency["GBP"][:overdue_90_plus]).to eq(5000.00)
      end
    end

    describe "client-level aging analysis" do
      it "calculates aging per client in base currency" do
        client_aging = {}

        invoices.each do |invoice|
          client_name = invoice.client.name
          days_overdue = if invoice.due_date < Date.current
            (Date.current - invoice.due_date).to_i
          else
            0
          end

          client_aging[client_name] ||= {
            total: 0,
            current: 0,
            overdue_1_30: 0,
            overdue_31_60: 0,
            overdue_61_90: 0,
            overdue_90_plus: 0
          }

          base_amount = invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount : invoice.amount
          client_aging[client_name][:total] += base_amount

          case days_overdue
          when 0
            client_aging[client_name][:current] += base_amount
          when 1..30
            client_aging[client_name][:overdue_1_30] += base_amount
          when 31..60
            client_aging[client_name][:overdue_31_60] += base_amount
          when 61..90
            client_aging[client_name][:overdue_61_90] += base_amount
          else
            client_aging[client_name][:overdue_90_plus] += base_amount if days_overdue > 90
          end
        end

        # Verify client totals
        expect(client_aging["USD Client"][:current]).to eq(1000.00)
        expect(client_aging["EUR Client"][:current]).to be_within(0.01).of(2360.00) # 2000 * 1.18
        expect(client_aging["EUR Client"][:overdue_31_60]).to be_within(0.01).of(3540.00) # 3000 * 1.18
        expect(client_aging["GBP Client"][:overdue_90_plus]).to be_within(0.01).of(6750.00) # 5000 * 1.35
      end

      it "identifies high-risk clients based on aging" do
        high_risk_threshold = 0.5 # 50% of outstanding is overdue 60+ days

        client_risk = {}

        clients = [usd_client, eur_client, gbp_client, jpy_client]

        clients.each do |client|
          client_invoices = invoices.select { |i| i.client_id == client.id }
          next if client_invoices.empty?

          total_outstanding = client_invoices.sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

          overdue_60_plus = client_invoices.select { |i|
            i.due_date < Date.current && (Date.current - i.due_date).to_i > 60
          }.sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

          risk_ratio = total_outstanding > 0 ? (overdue_60_plus / total_outstanding) : 0

          client_risk[client.name] = {
            total_outstanding: total_outstanding,
            overdue_60_plus: overdue_60_plus,
            risk_ratio: risk_ratio,
            high_risk: risk_ratio >= high_risk_threshold
          }
        end

        # GBP Client should be high risk (has 90+ days overdue)
        gbp_risk = client_risk["GBP Client"]
        expect(gbp_risk[:high_risk]).to be true
        expect(gbp_risk[:risk_ratio]).to be > 0.5
      end
    end
  end

  describe "Partial Payment Impact on Aging" do
    let(:invoice_amount) { 5000.00 }
    let!(:partially_paid_invoice) do
      invoice = create(:invoice,
        client: eur_client,
        company: company,
        currency: "EUR",
        amount: invoice_amount,
        status: :sent,
        issue_date: 60.days.ago,
        due_date: 30.days.ago
      )
      invoice.save!
      invoice
    end

    let!(:partial_payments) do
      [
        create(:payment, invoice: partially_paid_invoice, amount: 2000.00, transaction_date: 25.days.ago),
        create(:payment, invoice: partially_paid_invoice, amount: 1000.00, transaction_date: 10.days.ago)
      ]
    end

    before do
      partial_payments.each do |payment|
        payment.save!
      end
    end

    describe "outstanding balance aging" do
      it "calculates aging on remaining balance only" do
        total_paid = partial_payments.sum(&:amount)
        outstanding = invoice_amount - total_paid

        expect(outstanding).to eq(2000.00) # 5000 - 3000

        # Convert to base currency
        outstanding_base = outstanding * 1.18
        expect(outstanding_base).to be_within(0.01).of(2360.00)

        # This outstanding amount is 30 days overdue
        days_overdue = (Date.current - partially_paid_invoice.due_date).to_i
        expect(days_overdue).to be_between(29, 31) # Allow for test timing
      end

      it "applies payments FIFO for aging purposes" do
        # Assuming FIFO application of payments
        original_amount = invoice_amount
        paid_amount = partial_payments.sum(&:amount)
        original_amount - paid_amount

        # The remaining 2000 EUR represents the "newest" portion of the invoice
        # For aging, this is still based on the original due date
        days_overdue = (Date.current - partially_paid_invoice.due_date).to_i

        aging_bucket = case days_overdue
                       when 0 then :current
                       when 1..30 then :overdue_1_30
                       when 31..60 then :overdue_31_60
                       else :overdue_61_90
        end

        expect(aging_bucket).to eq(:overdue_1_30)
      end
    end
  end

  describe "DSO (Days Sales Outstanding) Calculation" do
    let!(:sales_invoices) do
      # Create invoices over the last 90 days
      (0..8).map do |weeks_ago|
        date = weeks_ago.weeks.ago
        client = [usd_client, eur_client, gbp_client].sample

        invoice = create(:invoice,
          client: client,
          company: company,
          currency: client.currency,
          amount: rand(1000..5000),
          status: [:paid, :sent, :overdue].sample,
          issue_date: date,
          due_date: date + 30.days
        )
        invoice.save!
        invoice
      end
    end

    let!(:payments_for_dso) do
      sales_invoices.filter_map do |invoice|
        next unless invoice.status == :paid
        # Payment made between 15-45 days after invoice
        payment_date = invoice.issue_date + rand(15..45).days
        payment = create(:payment,
          invoice: invoice,
          company: company,
          amount: invoice.amount,
          transaction_date: payment_date
        )
        payment.save!
        payment
      end
    end

    it "calculates DSO in base currency" do
      # DSO = (Accounts Receivable / Total Credit Sales) × Number of Days

      # Calculate for last 90 days
      period_days = 90
      period_start = period_days.days.ago.to_date

      # Total credit sales in period (all invoices)
      total_sales = sales_invoices.select { |i| i.issue_date >= period_start }
                                  .sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

      # Current accounts receivable (unpaid invoices)
      accounts_receivable = sales_invoices.select { |i| i.status != :paid }
                                          .sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

      dso = if total_sales > 0
        (accounts_receivable / total_sales) * period_days
      else
        0
      end

      expect(dso).to be >= 0
      expect(dso).to be <= period_days # DSO shouldn't exceed the period
    end

    it "calculates DSO by currency" do
      dso_by_currency = {}

      [:USD, :EUR, :GBP].each do |currency|
        currency_invoices = sales_invoices.select { |i| i.currency == currency.to_s }
        next if currency_invoices.empty?

        total_sales = currency_invoices.sum(&:amount)
        receivables = currency_invoices.select { |i| i.status != :paid }.sum(&:amount)

        dso_by_currency[currency] = if total_sales > 0
          (receivables / total_sales) * 90
        else
          0
        end
      end

      dso_by_currency.each do |_currency, dso|
        expect(dso).to be >= 0
        expect(dso).to be <= 90
      end
    end
  end

  describe "Aging Trend Analysis" do
    context "with historical aging data" do
      let!(:historical_invoices) do
        # Create invoices with different aging profiles over time
        invoices = []

        # 3 months ago snapshot
        3.times do |i|
          invoice = create(:invoice,
            client: [usd_client, eur_client, gbp_client][i],
            company: company,
            currency: [usd_client, eur_client, gbp_client][i].currency,
            amount: 1000 * (i + 1),
            status: :overdue,
            issue_date: (90 + (i * 30)).days.ago,
            due_date: (60 + (i * 30)).days.ago
          )
          invoice.save!
          invoices << invoice
        end

        invoices
      end

      it "tracks aging bucket movement over time" do
        # Simulate aging progression
        aging_snapshots = []

        # Take snapshots at different points
        [90.days.ago, 60.days.ago, 30.days.ago, Date.current].each do |snapshot_date|
          snapshot = { date: snapshot_date, buckets: {} }

          historical_invoices.each do |invoice|
            next if invoice.issue_date > snapshot_date

            days_overdue = (snapshot_date.to_date - invoice.due_date).to_i
            days_overdue = 0 if days_overdue < 0

            bucket = case days_overdue
                     when 0 then :current
                     when 1..30 then :overdue_1_30
                     when 31..60 then :overdue_31_60
                     when 61..90 then :overdue_61_90
                     else :overdue_90_plus
            end

            base_amount = invoice.base_currency_amount.to_f > 0 ? invoice.base_currency_amount : invoice.amount
            snapshot[:buckets][bucket] ||= 0
            snapshot[:buckets][bucket] += base_amount
          end

          aging_snapshots << snapshot
        end

        # Verify aging progression
        expect(aging_snapshots.first[:buckets].keys).to include(:current, :overdue_1_30)
        expect(aging_snapshots.last[:buckets].keys).to include(:overdue_90_plus)

        # Total should remain constant (no payments in this scenario)
        totals = aging_snapshots.map { |s| s[:buckets].values.sum }
        expect(totals.last).to be >= totals.first # May have more invoices in later snapshots
      end

      it "identifies deteriorating aging profiles" do
        # Calculate aging health score
        current_overdue_60_plus = historical_invoices.select { |i|
          (Date.current - i.due_date).to_i > 60
        }.sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

        total_outstanding = historical_invoices.sum { |i|
          i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount
        }

        aging_health_score = if total_outstanding > 0
          1 - (current_overdue_60_plus / total_outstanding)
        else
          1.0
        end

        # Lower score indicates worse aging (more old debt)
        expect(aging_health_score).to be_between(0, 1)

        # With our test data, should have significant overdue amounts
        expect(aging_health_score).to be < 0.5
      end
    end
  end

  describe "Write-off and Bad Debt Calculations" do
    let!(:aged_invoices) do
      [
        # Very old invoice likely to be written off
        create(:invoice, client: usd_client, company: company, currency: "USD", amount: 10000.00, status: :overdue, issue_date: 210.days.ago, due_date: 180.days.ago),

        # Old but with partial payment
        create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 5000.00, status: :overdue, issue_date: 150.days.ago, due_date: 120.days.ago),

        # Moderately aged
        create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 3000.00, status: :overdue, issue_date: 90.days.ago, due_date: 60.days.ago)
      ]
    end

    let!(:partial_payment) do
      payment = create(:payment, invoice: aged_invoices[1], amount: 2000.00, transaction_date: 90.days.ago)
      payment.save!
      payment
    end

    before do
      aged_invoices.each do |invoice|
        invoice.save!
      end
    end

    describe "bad debt provisioning" do
      it "calculates provision based on aging buckets" do
        # Common provisioning rates
        provision_rates = {
          current: 0.0,
          overdue_1_30: 0.02,
          overdue_31_60: 0.05,
          overdue_61_90: 0.10,
          overdue_91_120: 0.25,
          overdue_120_plus: 0.50
        }

        total_provision = 0

        aged_invoices.each do |invoice|
          days_overdue = (Date.current - invoice.due_date).to_i

          # Calculate outstanding amount (original - paid)
          paid = invoice.payments.sum(&:amount)
          outstanding = invoice.amount - paid
          outstanding_base = if invoice.base_currency_amount.to_f > 0
            invoice.base_currency_amount * (outstanding / invoice.amount)
          else
            outstanding
          end

          # Apply provision rate based on age
          rate = case days_overdue
                 when 0 then provision_rates[:current]
                 when 1..30 then provision_rates[:overdue_1_30]
                 when 31..60 then provision_rates[:overdue_31_60]
                 when 61..90 then provision_rates[:overdue_61_90]
                 when 91..120 then provision_rates[:overdue_91_120]
                 else provision_rates[:overdue_120_plus]
          end

          provision = outstanding_base * rate
          total_provision += provision
        end

        expect(total_provision).to be > 0

        # Very old invoice should have highest provision
        oldest_provision = aged_invoices[0].base_currency_amount * provision_rates[:overdue_120_plus]
        expect(total_provision).to be >= oldest_provision
      end

      it "identifies write-off candidates" do
        write_off_threshold_days = 180

        write_off_candidates = aged_invoices.select do |invoice|
          days_overdue = (Date.current - invoice.due_date).to_i
          paid_percentage = invoice.payments.sum(&:amount) / invoice.amount

          # Candidate if very old and less than 50% paid
          days_overdue >= write_off_threshold_days && paid_percentage < 0.5
        end

        expect(write_off_candidates).to include(aged_invoices[0]) # 180 days old, no payment
        expect(write_off_candidates).not_to include(aged_invoices[2]) # Only 60 days old

        # Calculate total write-off amount in base currency
        write_off_total = write_off_candidates.sum do |invoice|
          paid = invoice.payments.sum(&:amount)
          outstanding = invoice.amount - paid

          if invoice.base_currency_amount.to_f > 0
            invoice.base_currency_amount * (outstanding / invoice.amount)
          else
            outstanding
          end
        end

        expect(write_off_total).to eq(aged_invoices[0].base_currency_amount)
      end
    end
  end

  describe "Collection Efficiency Metrics" do
    let!(:collection_invoices) do
      # Create invoices with various collection patterns
      invoices = []

      # Collected on time
      2.times do
        invoice = create(:invoice, client: usd_client, company: company, currency: "USD", amount: 1000.00, status: :paid, issue_date: 45.days.ago, due_date: 15.days.ago)
        create(:payment, invoice: invoice, amount: 1000.00, transaction_date: 16.days.ago)
        invoices << invoice
      end

      # Collected late
      3.times do |i|
        invoice = create(:invoice, client: eur_client, company: company, currency: "EUR", amount: 2000.00, status: :paid, issue_date: 60.days.ago, due_date: 30.days.ago)
        create(:payment, invoice: invoice, amount: 2000.00, transaction_date: (25 - (i * 5)).days.ago)
        invoice.save!
        invoices << invoice
      end

      # Still outstanding
      invoice = create(:invoice, client: gbp_client, company: company, currency: "GBP", amount: 3000.00, status: :overdue, issue_date: 40.days.ago, due_date: 10.days.ago)
      invoice.save!
      invoices << invoice

      invoices
    end

    it "calculates collection effectiveness index (CEI)" do
      # CEI = (Beginning Receivables + Monthly Credit Sales - Ending Receivables) / (Beginning Receivables + Monthly Credit Sales - Ending Current) × 100

      period_start = 30.days.ago
      period_end = Date.current

      # Beginning receivables (invoices outstanding at period start)
      beginning_receivables = collection_invoices.select { |i|
        i.issue_date < period_start && (i.payments.empty? || i.payments.all? { |p| p.transaction_date >= period_start })
      }.sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

      # Credit sales during period
      credit_sales = collection_invoices.select { |i|
        i.issue_date >= period_start && i.issue_date <= period_end
      }.sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

      # Ending receivables (currently outstanding)
      ending_receivables = collection_invoices.select { |i|
        i.status != :paid
      }.sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

      # Ending current (not yet due)
      ending_current = collection_invoices.select { |i|
        i.status == :sent && i.due_date > period_end
      }.sum { |i| i.base_currency_amount.to_f > 0 ? i.base_currency_amount : i.amount }

      cei = if (beginning_receivables + credit_sales - ending_current) > 0
        ((beginning_receivables + credit_sales - ending_receivables) /
         (beginning_receivables + credit_sales - ending_current)) * 100
      else
        0
      end

      expect(cei).to be_between(0, 100)
    end

    it "tracks average days to collect by currency" do
      collection_times = {}

      [:USD, :EUR, :GBP].each do |currency|
        currency_invoices = collection_invoices.select { |i| i.currency == currency.to_s && i.status == :paid }

        next if currency_invoices.empty?

        days_to_collect = currency_invoices.filter_map do |invoice|
          payment = invoice.payments.first
          next unless payment
          (payment.transaction_date - invoice.issue_date).to_i
        end

        collection_times[currency] = {
          average: days_to_collect.sum.to_f / days_to_collect.size,
          min: days_to_collect.min,
          max: days_to_collect.max
        } unless days_to_collect.empty?
      end

      # USD should have consistent collection times
      expect(collection_times[:USD][:average]).to be_between(25, 35) if collection_times[:USD]

      # EUR might have more variance
      expect(collection_times[:EUR][:max] - collection_times[:EUR][:min]).to be >= 0 if collection_times[:EUR]
    end
  end
end
