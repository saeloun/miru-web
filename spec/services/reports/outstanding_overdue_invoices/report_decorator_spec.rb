# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::OutstandingOverdueInvoices::ReportDecorator do
  let(:company) { create(:company) }
  let(:client1) { create(:client, company: company) }
  let(:client2) { create(:client, company: company) }

  let(:service) { described_class.new(company) }

  describe "#process" do
    subject { service.process }

    context "with outstanding and overdue invoices" do
      before do
        # Create outstanding invoices for client1
        create(:invoice, client: client1, company: company, amount: 1000, status: "sent")
        create(:invoice, client: client1, company: company, amount: 500, status: "viewed")

        # Create overdue invoice for client1
        create(:invoice, client: client1, company: company, amount: 750, status: "overdue")

        # Create outstanding invoice for client2
        create(:invoice, client: client2, company: company, amount: 300, status: "sent")

        # Create paid invoice (should not be included)
        create(:invoice, client: client2, company: company, amount: 2000, status: "paid")
      end

      it "returns correct structure" do
        result = subject

        expect(result).to have_key(:invoices)
        expect(result).to have_key(:summary)
        expect(result).to have_key(:clients_data)
        expect(result).to have_key(:company)
      end

      it "filters only outstanding and overdue invoices" do
        result = subject

        expect(result[:invoices].count).to eq(4)
        expect(result[:invoices].pluck(:status)).to all(be_in(["sent", "viewed", "overdue"]))
      end

      it "calculates correct summary amounts" do
        result = subject

        expect(result[:summary][:total_outstanding_amount]).to eq(1800) # sent + viewed
        expect(result[:summary][:total_overdue_amount]).to eq(750)
        expect(result[:summary][:currency]).to eq(company.base_currency)
      end

      it "groups invoices by client" do
        result = subject
        clients_data = result[:clients_data]

        expect(clients_data.size).to eq(2)

        client1_data = clients_data.find { |c| c[:client].id == client1.id }
        expect(client1_data[:total_outstanding]).to eq(1500) # 1000 + 500
        expect(client1_data[:total_overdue]).to eq(750)
        expect(client1_data[:invoices].size).to eq(3)

        client2_data = clients_data.find { |c| c[:client].id == client2.id }
        expect(client2_data[:total_outstanding]).to eq(300)
        expect(client2_data[:total_overdue]).to eq(0)
        expect(client2_data[:invoices].size).to eq(1)
      end
    end

    context "with no outstanding invoices" do
      before do
        create(:invoice, client: client1, company: company, amount: 1000, status: "paid")
        create(:invoice, client: client2, company: company, amount: 500, status: "draft")
      end

      it "returns empty results" do
        result = subject

        expect(result[:invoices]).to be_empty
        expect(result[:summary][:total_outstanding_amount]).to eq(0)
        expect(result[:summary][:total_overdue_amount]).to eq(0)
        expect(result[:clients_data]).to be_empty
      end
    end

    context "with mixed invoice statuses" do
      before do
        create(:invoice, client: client1, company: company, amount: 100, status: "sent")
        create(:invoice, client: client1, company: company, amount: 200, status: "viewed")
        create(:invoice, client: client1, company: company, amount: 300, status: "overdue")
      end

      it "correctly categorizes invoice amounts" do
        result = subject

        expect(result[:summary][:total_outstanding_amount]).to eq(300) # sent + viewed
        expect(result[:summary][:total_overdue_amount]).to eq(300) # overdue only
      end
    end
  end
end
