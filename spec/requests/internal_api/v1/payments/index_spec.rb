# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Payments#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client, company:, name: "bob") }
  let!(:client1_sent_invoice1) { create(:invoice, client: client1, company:, status: "sent") }
  let!(:client1_sent_invoice2) { create(:invoice, client: client1, company:, status: "sent") }
  let!(:payment1) { create(:payment, invoice: client1_sent_invoice1, status: "failed") }
  let!(:payment2) { create(:payment, invoice: client1_sent_invoice1, status: "paid") }
  let!(:payment3) { create(:payment, invoice: client1_sent_invoice2, status: "partially_paid") }
  let!(:expected_api_response) { [payment3, payment2, payment1].map do | payment |
                                    {
                                      id: payment.id,
                                      clientName: client1.name,
                                      invoiceNumber: payment.invoice.invoice_number,
                                      invoiceId: payment.invoice.id,
                                      transactionDate: CompanyDateFormattingService.new(
                                        payment.transaction_date,
                                        company:).process,
                                      note: payment.note,
                                      transactionType: payment.transaction_type,
                                      amount: payment.amount,
                                      status: payment.status
                                    }
                                  end
                                }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "when tries to fetch payments list" do
      it "returns the list of payments" do
        get internal_api_v1_payments_path, headers: auth_headers(user)
        expect(response).to have_http_status(:ok)

        expect(json_response["payments"]).to eq(JSON.parse(expected_api_response.to_json))
      end
    end
  end

  context "when user is a bookeeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    describe "when tries to fetch payments list" do
      it "returns the list of payments" do
        get internal_api_v1_payments_path, headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["payments"]).to eq(JSON.parse(expected_api_response.to_json))
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    describe "when tries to fetch payments list" do
      it "returns forbidden" do
        get internal_api_v1_payments_path, headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when unauthenticated" do
    describe "when tries to fetch payments list" do
      it "returns unauthorized" do
        send_request :post, internal_api_v1_payments_path(payment: {})
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
      end
    end
  end
end
