# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoices::View", type: :request do
  describe "#show" do
    let(:company) { create(:company) }
    let(:client) { create(:client, company:) }
    let(:invoice) { create(:invoice, client:, company:) }

    context "when unauthenticated" do
      it "is able to view the client invoice successfully" do
        send_request :get, view_invoice_path(invoice)
        expect(response).to be_successful
      end
    end
  end
end
