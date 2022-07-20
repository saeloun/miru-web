# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Payments#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client, company:, name: "bob") }
  let!(:client1_sent_invoice1) { create(:invoice, client: client1, status: "sent") }
  let!(:client1_sent_invoice2) { create(:invoice, client: client1, status: "sent") }
  let!(:client1_viewed_invoice1) { create(:invoice, client: client1, status: "viewed") }
  let(:client1_paid_invoice1) { create(:invoice, client: client1, status: "paid") }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "returns the unpaid invoices" do
      send_request :get, new_internal_api_v1_payment_path
      expect(response).to have_http_status(:ok)
      expect(json_response["invoices"].pluck("id")).to eq(
        [client1_sent_invoice1.id, client1_sent_invoice2.id,
         client1_viewed_invoice1.id])
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
        send_request :post, internal_api_v1_payments_path(payment: {})
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
        send_request :post, internal_api_v1_payments_path(payment: {})
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when unauthenticated" do
    describe "when tries to create manual payment entry" do
      it "returns unauthorized" do
        send_request :post, internal_api_v1_payments_path(payment: {})
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
      end
    end
  end
end
