# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Payments#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client, company:, name: "bob") }
  let!(:client1_sent_invoice1) { create(:invoice, client: client1, company:, status: "sent") }
  let!(:client1_sent_invoice2) { create(:invoice, client: client1, company:, status: "sent") }
  let!(:client1_viewed_invoice1) { create(:invoice, client: client1, company:, status: "viewed") }
  let!(:client1_paid_invoice1) { create(:invoice, client: client1, company:, status: "paid") }
  let!(:client1_overdue_invoice1) { create(:invoice, client: client1, company:, status: "overdue") }
  let!(:client1_draft_invoice1) { create(:invoice, client: client1, company:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "returns the unpaid invoices" do
      send_request :get, new_api_v1_payment_path, headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_response["invoices"].pluck("id")).to eq(
        [client1_sent_invoice1.id, client1_sent_invoice2.id,
         client1_viewed_invoice1.id, client1_overdue_invoice1.id])
      expect(json_response["invoices"].pluck("id")).not_to include(client1_paid_invoice1.id, client1_draft_invoice1.id)
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      @payment = {
        invoice_id: client1_sent_invoice1.id,
        transaction_date: Date.current,
        transaction_type: "visa",
        amount: 80,
        note: "This is transaction ID - 123"
      }
      user.add_role :employee, company
      sign_in user
    end

    describe "when tries to create manual payment entry" do
      it "returns forbidden" do
        send_request :post, api_v1_payments_path(payment: @payment), headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      @payment = {
        invoice_id: client1_sent_invoice1.id,
        transaction_date: Date.current,
        transaction_type: "visa",
        amount: 80,
        note: "This is transaction ID - 123"
      }
      user.add_role :book_keeper, company
      sign_in user
    end

    describe "when tries to create manual payment entry" do
      it "returns success" do
        send_request :post, api_v1_payments_path(payment: @payment), headers: auth_headers(user)
        expect(response).to have_http_status(:created)
      end
    end
  end

  context "when unauthenticated" do
    describe "when tries to create manual payment entry" do
      it "returns unauthorized" do
        send_request :post, api_v1_payments_path(payment: {})
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
      end
    end
  end
end
