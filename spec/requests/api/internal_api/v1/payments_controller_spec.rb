# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::PaymentsController, type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client1) { create(:client, name: "Acme Corp", company:) }
  let(:client2) { create(:client, name: "Tech Solutions", company:) }
  let(:invoice1) { create(:invoice, client: client1, company:, invoice_number: "INV-001", status: "paid") }
  let(:invoice2) { create(:invoice, client: client2, company:, invoice_number: "INV-002", status: "paid") }
  let(:invoice3) { create(:invoice, client: client1, company:, invoice_number: "INV-003", status: "paid") }

  let!(:payment1) do
    create(:payment,
      invoice: invoice1,
      amount: 1500.00,
      transaction_date: 2.days.ago,
      transaction_type: "bank_transfer")
  end

  let!(:payment2) do
    create(:payment,
      invoice: invoice2,
      amount: 2500.00,
      transaction_date: 1.day.ago,
      transaction_type: "credit_card")
  end

  let!(:payment3) do
    create(:payment,
      invoice: invoice3,
      amount: 3500.00,
      transaction_date: Date.today,
      transaction_type: "cheque")
  end

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  describe "GET #index" do
    context "without search query" do
      it "returns all payments ordered by created_at desc" do
        get "/api/v1/payments"

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)

        # Debug: print the response to understand the structure
        puts "Response body: #{response.body}" if json_response["payments"].blank?

        expect(json_response["payments"]).to be_present
        expect(json_response["payments"].length).to eq(3)

        # Verify order (most recent first)
        payment_ids = json_response["payments"].pluck("id")
        expect(payment_ids).to eq([payment3.id, payment2.id, payment1.id])
      end
    end

    context "with search query" do
      context "searching by client name" do
        it "returns payments matching the client name" do
          get "/api/v1/payments", params: { query: "Acme" }

          expect(response).to have_http_status(:success)
          json_response = JSON.parse(response.body)

          expect(json_response["payments"].length).to eq(2)
          client_names = json_response["payments"].pluck("clientName").uniq
          expect(client_names).to eq(["Acme Corp"])
        end

        it "performs case-insensitive search" do
          get "/api/v1/payments", params: { query: "TECH" }

          expect(response).to have_http_status(:success)
          json_response = JSON.parse(response.body)

          expect(json_response["payments"].length).to eq(1)
          expect(json_response["payments"].first["clientName"]).to eq("Tech Solutions")
        end
      end

      context "searching by invoice number" do
        it "returns payments matching the invoice number" do
          get "/api/v1/payments", params: { query: "INV-002" }

          expect(response).to have_http_status(:success)
          json_response = JSON.parse(response.body)

          expect(json_response["payments"].length).to eq(1)
          expect(json_response["payments"].first["invoiceNumber"]).to eq("INV-002")
        end

        it "supports partial invoice number search" do
          get "/api/v1/payments", params: { query: "001" }

          expect(response).to have_http_status(:success)
          json_response = JSON.parse(response.body)

          expect(json_response["payments"].length).to eq(1)
          expect(json_response["payments"].first["invoiceNumber"]).to eq("INV-001")
        end
      end

      context "searching by amount" do
        it "returns payments matching the amount" do
          get "/api/v1/payments", params: { query: "2500" }

          expect(response).to have_http_status(:success)
          json_response = JSON.parse(response.body)

          expect(json_response["payments"].length).to eq(1)
          expect(json_response["payments"].first["amount"].to_f).to eq(2500.0)
        end

        it "supports partial amount search" do
          get "/api/v1/payments", params: { query: "500" }

          expect(response).to have_http_status(:success)
          json_response = JSON.parse(response.body)

          # Should match 1500, 2500, and 3500
          expect(json_response["payments"].length).to eq(3)
        end
      end

      context "with empty search query" do
        it "returns all payments when query is empty string" do
          get "/api/v1/payments", params: { query: "" }

          expect(response).to have_http_status(:success)
          json_response = JSON.parse(response.body)

          expect(json_response["payments"].length).to eq(3)
        end

        it "returns all payments when query contains only spaces" do
          get "/api/v1/payments", params: { query: "   " }

          expect(response).to have_http_status(:success)
          json_response = JSON.parse(response.body)

          expect(json_response["payments"].length).to eq(3)
        end
      end

      context "with no matching results" do
        it "returns empty array when no payments match" do
          get "/api/v1/payments", params: { query: "NonExistent" }

          expect(response).to have_http_status(:success)
          json_response = JSON.parse(response.body)

          expect(json_response["payments"]).to eq([])
        end
      end
    end

    context "authorization" do
      context "when user is not admin" do
        let(:employee) { create(:user, current_workspace_id: company.id) }

        before do
          create(:employment, company:, user: employee)
          employee.add_role :employee, company
          sign_in employee
        end

        it "returns forbidden status" do
          get "/api/v1/payments"

          expect(response).to have_http_status(:forbidden)
        end
      end

      context "when user is not signed in" do
        before { sign_out user }

        it "returns unauthorized status" do
          get "/api/v1/payments"

          expect(response).to have_http_status(:unauthorized)
        end
      end
    end
  end

  describe "POST #create" do
    let(:valid_payment_params) do
      {
        payment: {
          invoice_id: invoice1.id,
          transaction_date: Date.today,
          transaction_type: "bank_transfer",
          amount: 500.00,
          note: "Partial payment"
        }
      }
    end

    context "with valid params" do
      it "creates a new payment" do
        expect {
          post "/api/v1/payments", params: valid_payment_params
        }.to change(Payment, :count).by(1)

        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)

        expect(json_response["payment"]).to be_present
        expect(json_response["payment"]["amount"].to_f).to eq(500.0)
        expect(json_response["payment"]["note"]).to eq("Partial payment")
      end
    end

    context "with invalid params" do
      it "returns error when invoice_id is missing" do
        invalid_params = valid_payment_params.deep_dup
        invalid_params[:payment][:invoice_id] = nil

        post "/api/v1/payments", params: invalid_params

        expect(response).to have_http_status(:not_found).or have_http_status(:unprocessable_content)
      end
    end
  end

  describe "GET #new" do
    it "returns list of unpaid invoices" do
      # Create an unpaid invoice
      unpaid_invoice = create(:invoice, client: client1, company:, status: "sent")

      get "/api/v1/payments/new"

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)

      expect(json_response["invoices"]).to be_present
      invoice_ids = json_response["invoices"].pluck("id")
      expect(invoice_ids).to include(unpaid_invoice.id)
      expect(invoice_ids).not_to include(invoice1.id) # paid invoice should not be included
    end
  end
end
