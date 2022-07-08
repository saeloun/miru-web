# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Payments::Providers#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client, company:, name: "bob") }
  let!(:client1_sent_invoice1) { create(:invoice, client: client1, status: "sent") }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "adds the payment entry successfully" do
      payment = {
        invoice_id: client1_sent_invoice1.id, transaction_date: Date.current,
        transaction_type: "visa", amount: 200, note: "This is transaction ID - 123"
      }
      expected_payment_response = {
        payment: {
          id: 1, invoiceNumber: client1_sent_invoice1.invoice_number,
          transactionDate: Date.current, note: payment[:note],
          transactionType: payment[:transaction_type], clientName: client1.name,
          amount: payment[:amount].to_f.to_s, status: "paid"
        },
        baseCurrency: company.base_currency
      }
      send_request :post, internal_api_v1_payments_invoices_path(payment:)
      expect(response).to have_http_status(:ok)
      expect(json_response).to eq(JSON.parse(expected_payment_response.to_json))
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    describe "when tries to create manual payment entry" do
      it "returns forbidden" do
        send_request :post, internal_api_v1_payments_invoices_path(payment: {})
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    describe "when tries to create manual payment entry" do
      it "returns forbidden" do
        send_request :post, internal_api_v1_payments_invoices_path(payment: {})
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when unauthenticated" do
    describe "when tries to create manual payment entry" do
      it "returns unauthorized" do
        send_request :post, internal_api_v1_payments_invoices_path(payment: {})
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
      end
    end
  end
end
