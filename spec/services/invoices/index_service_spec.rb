# frozen_string_literal: true

require "rails_helper"

RSpec.describe Invoices::IndexService do
  describe ".process" do
    let(:company) { create(:company) }
    let(:client_one) { create(:client, company:, name: "Alpha Labs") }
    let(:client_two) { create(:client, company:, name: "Beta Systems") }
    let!(:invoice_one) { create(:invoice, company:, client: client_one, status: :draft, invoice_number: "INV-1001") }
    let!(:invoice_two) { create(:invoice, company:, client: client_two, status: :sent, invoice_number: "INV-2002") }

    it "returns paginated invoices, summary, and recently updated invoices" do
      response = described_class.process(company, ActionController::Parameters.new(invoices_per_page: 1, page: 1))

      expect(response[:invoices].length).to eq(1)
      expect(response[:pagination_details]).to include(page: 1, pages: 2, total: 2)
      expect(response[:summary]).to include(:draftAmount, :outstandingAmount, :overdueAmount, :totalAmount, :currency)
      expect(response[:recently_updated_invoices].map(&:id)).to include(invoice_one.id, invoice_two.id)
    end

    it "filters by search query" do
      response = described_class.process(company, ActionController::Parameters.new(query: "Alpha"))

      expect(response[:invoices].map(&:id)).to eq([invoice_one.id])
    end

    it "filters by client ids" do
      response = described_class.process(company, ActionController::Parameters.new(client_ids: [client_two.id]))

      expect(response[:invoices].map(&:id)).to eq([invoice_two.id])
    end
  end
end
