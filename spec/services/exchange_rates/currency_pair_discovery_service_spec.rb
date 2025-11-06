# frozen_string_literal: true

require "rails_helper"

RSpec.describe ExchangeRates::CurrencyPairDiscoveryService, type: :service do
  let(:service) { described_class.new }

  describe "#process" do
    context "with companies and clients using different currencies" do
      let!(:company_usd) { create(:company, base_currency: "USD") }
      let!(:company_eur) { create(:company, base_currency: "EUR") }
      let!(:client_eur) { create(:client, company: company_usd, currency: "EUR") }
      let!(:client_gbp) { create(:client, company: company_usd, currency: "GBP") }
      let!(:client_usd) { create(:client, company: company_eur, currency: "USD") }

      before do
        # Ensure all test data is created for discovery service
        [client_eur, client_gbp, client_usd]
      end

      it "discovers currency pairs from companies and clients" do
        result = service.process
        pairs = result[:discovered_pairs]

        # Should discover: EUR->USD, USD->EUR, GBP->USD, USD->GBP, USD->EUR, EUR->USD
        expect(pairs).to include(["EUR", "USD"])
        expect(pairs).to include(["USD", "EUR"])
        expect(pairs).to include(["GBP", "USD"])
        expect(pairs).to include(["USD", "GBP"])
      end

      it "returns the total number of discovered pairs" do
        result = service.process
        expect(result[:total_pairs]).to be > 0
      end

      it "creates currency pairs in the database" do
        expect {
          service.process
        }.to change(CurrencyPair, :count)
      end

      it "activates discovered pairs" do
        service.process
        pair = CurrencyPair.find_by(from_currency: "EUR", to_currency: "USD")
        expect(pair).to be_present
        expect(pair.active).to be true
      end

      it "returns activation count" do
        result = service.process
        expect(result[:activated]).to be > 0
      end
    end

    context "with all companies and clients using same currency" do
      let!(:company) { create(:company, base_currency: "USD") }
      let!(:client1) { create(:client, company:, currency: "USD") }
      let!(:client2) { create(:client, company:, currency: "USD") }

      before do
        # Ensure test data is created for discovery service
        [client1, client2]
      end

      it "discovers no currency pairs" do
        result = service.process
        expect(result[:discovered_pairs]).to be_empty
      end

      it "returns zero total pairs" do
        result = service.process
        expect(result[:total_pairs]).to eq(0)
      end
    end

    context "with recent invoices" do
      let!(:company) { create(:company, base_currency: "USD") }
      let!(:client) { create(:client, company:, currency: "USD") }
      let!(:invoice_eur) do
        create(
          :invoice,
          company:,
          client:,
          currency: "EUR",
          created_at: 2.months.ago
        )
      end
      let!(:invoice_gbp) do
        create(
          :invoice,
          company:,
          client:,
          currency: "GBP",
          created_at: 1.month.ago
        )
      end

      before do
        # Ensure invoices are created for discovery service
        [invoice_eur, invoice_gbp]
      end

      it "discovers pairs from recent invoices" do
        result = service.process
        pairs = result[:discovered_pairs]

        expect(pairs).to include(["EUR", "USD"])
        expect(pairs).to include(["GBP", "USD"])
      end

      it "ignores old invoices" do
        old_invoice = create(
          :invoice,
          company:,
          client:,
          currency: "JPY",
          created_at: 7.months.ago
        )

        result = service.process
        pairs = result[:discovered_pairs]

        expect(pairs).not_to include(["JPY", "USD"])
      end

      it "ignores discarded invoices" do
        invoice_eur.discard!

        result = service.process
        pairs = result[:discovered_pairs]

        expect(pairs).not_to include(["EUR", "USD"])
      end
    end

    context "with existing currency pairs" do
      let!(:company) { create(:company, base_currency: "USD") }
      let!(:client) { create(:client, company:, currency: "EUR") }
      let!(:existing_pair) { create(:currency_pair, from_currency: "EUR", to_currency: "USD", active: false) }

      before do
        # Ensure client is created for discovery service
        client
      end

      it "activates existing inactive pairs" do
        service.process
        expect(existing_pair.reload.active).to be true
      end

      it "counts activated pairs" do
        result = service.process
        expect(result[:activated]).to eq(2) # EUR->USD and USD->EUR
      end
    end

    context "with unused currency pairs" do
      let!(:company) { create(:company, base_currency: "USD") }
      let!(:client) { create(:client, company:, currency: "EUR") }
      let!(:unused_pair) do
        create(
          :currency_pair,
          from_currency: "GBP",
          to_currency: "JPY",
          active: true,
          last_updated_at: 60.days.ago
        )
      end

      before do
        # Ensure client is created for discovery service
        client
      end

      it "deactivates unused pairs" do
        service.process
        expect(unused_pair.reload.active).to be false
      end

      it "counts deactivated pairs" do
        result = service.process
        expect(result[:deactivated]).to eq(1)
      end

      it "does not deactivate recently updated pairs" do
        recent_pair = create(
          :currency_pair,
          from_currency: "CAD",
          to_currency: "AUD",
          active: true,
          last_updated_at: 10.days.ago
        )

        service.process
        expect(recent_pair.reload.active).to be true
      end
    end

    context "with case-insensitive currencies" do
      let!(:company) { create(:company, base_currency: "usd") }
      let!(:client) { create(:client, company:, currency: "eur") }

      before do
        # Ensure client is created for discovery service
        client
      end

      it "normalizes currencies to uppercase" do
        result = service.process
        pairs = result[:discovered_pairs]

        expect(pairs).to include(["EUR", "USD"])
        expect(pairs).not_to include(["eur", "usd"])
      end
    end

    context "with discarded clients" do
      let!(:company) { create(:company, base_currency: "USD") }
      let!(:active_client) { create(:client, company:, currency: "EUR") }
      let!(:discarded_client) { create(:client, company:, currency: "GBP") }

      before do
        # Ensure clients are created for discovery service
        [active_client, discarded_client]
        discarded_client.discard!
      end

      it "ignores discarded clients" do
        result = service.process
        pairs = result[:discovered_pairs]

        expect(pairs).to include(["EUR", "USD"])
        expect(pairs).not_to include(["GBP", "USD"])
      end
    end

    context "with multiple companies" do
      let!(:company1) { create(:company, base_currency: "USD") }
      let!(:company2) { create(:company, base_currency: "EUR") }
      let!(:company3) { create(:company, base_currency: "GBP") }
      let!(:client1) { create(:client, company: company1, currency: "EUR") }
      let!(:client2) { create(:client, company: company2, currency: "USD") }
      let!(:client3) { create(:client, company: company3, currency: "USD") }

      before do
        # Ensure all clients are created for discovery service
        [client1, client2, client3]
      end

      it "discovers pairs across all companies" do
        result = service.process
        pairs = result[:discovered_pairs]

        expect(pairs).to include(["EUR", "USD"])
        expect(pairs).to include(["USD", "EUR"])
        expect(pairs).to include(["USD", "GBP"])
        expect(pairs).to include(["GBP", "USD"])
      end

      it "does not create duplicate pairs" do
        result = service.process
        pairs = result[:discovered_pairs]

        # Count how many times EUR->USD appears
        eur_usd_count = pairs.count { |from, to| from == "EUR" && to == "USD" }
        expect(eur_usd_count).to eq(1)
      end
    end

    context "when running integration test" do
      let!(:company) { create(:company, base_currency: "USD") }
      let!(:client_eur) { create(:client, company:, currency: "EUR") }
      let!(:client_gbp) { create(:client, company:, currency: "GBP") }
      let!(:invoice) do
        create(
          :invoice,
          company:,
          client: client_eur,
          currency: "JPY",
          created_at: 1.month.ago
        )
      end

      before do
        # Ensure all test data is created for discovery service
        [client_eur, client_gbp, invoice]
      end

      it "discovers pairs from both clients and invoices" do
        result = service.process
        pairs = result[:discovered_pairs]

        # From clients
        expect(pairs).to include(["EUR", "USD"])
        expect(pairs).to include(["GBP", "USD"])

        # From invoice
        expect(pairs).to include(["JPY", "USD"])
      end

      it "creates all pairs in database as active" do
        service.process

        eur_usd = CurrencyPair.find_by(from_currency: "EUR", to_currency: "USD")
        gbp_usd = CurrencyPair.find_by(from_currency: "GBP", to_currency: "USD")
        jpy_usd = CurrencyPair.find_by(from_currency: "JPY", to_currency: "USD")

        expect(eur_usd).to be_active
        expect(gbp_usd).to be_active
        expect(jpy_usd).to be_active
      end
    end
  end
end
