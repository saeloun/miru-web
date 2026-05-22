# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Payments#bulk_download", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, name: "Acme Corp", company:) }
  let(:invoice) { create(:invoice, client:, company:, invoice_number: "INV-001", status: "paid") }

  let!(:payment1) do
    create(:payment,
      invoice:,
      amount: 1500.00,
      transaction_date: 2.days.ago,
      transaction_type: "bank_transfer",
      note: "First payment")
  end

  let!(:payment2) do
    create(:payment,
      invoice:,
      amount: 2500.00,
      transaction_date: 1.day.ago,
      transaction_type: "credit_card",
      note: "Second payment")
  end

  let!(:payment3) do
    create(:payment,
      invoice:,
      amount: 3500.00,
      transaction_date: Date.today,
      transaction_type: "cheque",
      note: "Third payment")
  end

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  describe "GET /api/v1/payments/bulk_download" do
    context "with valid payment IDs" do
      it "returns a CSV file with selected payments" do
        get "/api/v1/payments/bulk_download", params: { ids: "#{payment1.id},#{payment2.id}" }

        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include("text/csv")
        expect(response.headers["Content-Disposition"]).to include("payments_export_")
        expect(response.headers["Content-Disposition"]).to include(".csv")

        csv_lines = response.body.split("\n")
        # Header + 2 data rows
        expect(csv_lines.length).to eq(3)
        expect(csv_lines[0]).to include("Date")
        expect(csv_lines[0]).to include("Client")
        expect(csv_lines[0]).to include("Invoice Number")
        expect(csv_lines[0]).to include("Amount")
      end

      it "includes correct payment data in CSV" do
        get "/api/v1/payments/bulk_download", params: { ids: "#{payment1.id},#{payment2.id}" }

        expect(response.body).to include("Acme Corp")
        expect(response.body).to include("INV-001")
        expect(response.body).to include("1500.0")
        expect(response.body).to include("2500.0")
        expect(response.body).not_to include("3500.0")
      end

      it "downloads all selected payments" do
        get "/api/v1/payments/bulk_download", params: {
          ids: "#{payment1.id},#{payment2.id},#{payment3.id}"
        }

        expect(response).to have_http_status(:ok)
        csv_lines = response.body.split("\n")
        # Header + 3 data rows
        expect(csv_lines.length).to eq(4)
      end

      it "downloads a single payment" do
        get "/api/v1/payments/bulk_download", params: { ids: payment1.id.to_s }

        expect(response).to have_http_status(:ok)
        csv_lines = response.body.split("\n")
        expect(csv_lines.length).to eq(2)
      end
    end

    context "with invalid payment IDs" do
      it "returns not found when no payments match" do
        get "/api/v1/payments/bulk_download", params: { ids: "999999,888888" }

        expect(response).to have_http_status(:not_found)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq("No payments found for the given IDs")
      end

      it "returns not found when ids param is empty" do
        get "/api/v1/payments/bulk_download", params: { ids: "" }

        expect(response).to have_http_status(:not_found)
      end
    end

    context "with payments from another company" do
      let(:other_company) { create(:company) }
      let(:other_client) { create(:client, company: other_company) }
      let(:other_invoice) { create(:invoice, client: other_client, company: other_company) }
      let!(:other_payment) { create(:payment, invoice: other_invoice, amount: 999.00) }

      it "does not include payments from other companies" do
        get "/api/v1/payments/bulk_download", params: {
          ids: "#{payment1.id},#{other_payment.id}"
        }

        expect(response).to have_http_status(:ok)
        # Should only include payment1, not other_payment
        expect(response.body).to include("1500.0")
        expect(response.body).not_to include("999.0")
      end
    end

    context "authorization" do
      context "when user is an employee" do
        let(:employee) { create(:user, current_workspace_id: company.id) }

        before do
          create(:employment, company:, user: employee)
          employee.add_role :employee, company
          sign_in employee
        end

        it "returns forbidden status" do
          get "/api/v1/payments/bulk_download", params: { ids: payment1.id.to_s }

          expect(response).to have_http_status(:forbidden)
        end
      end

      context "when user is not signed in" do
        before { sign_out user }

        it "returns unauthorized status" do
          get "/api/v1/payments/bulk_download", params: { ids: payment1.id.to_s }

          expect(response).to have_http_status(:unauthorized)
        end
      end

      context "when user is a book keeper" do
        let(:book_keeper) { create(:user, current_workspace_id: company.id) }

        before do
          create(:employment, company:, user: book_keeper)
          book_keeper.add_role :book_keeper, company
          sign_in book_keeper
        end

        it "allows access" do
          get "/api/v1/payments/bulk_download", params: { ids: payment1.id.to_s }

          expect(response).to have_http_status(:ok)
        end
      end
    end

    context "CSV content format" do
      it "includes all expected columns in the header" do
        get "/api/v1/payments/bulk_download", params: { ids: payment1.id.to_s }

        header_line = response.body.split("\n").first
        expect(header_line).to include("Date")
        expect(header_line).to include("Client")
        expect(header_line).to include("Invoice Number")
        expect(header_line).to include("Payment Method")
        expect(header_line).to include("Transaction ID")
        expect(header_line).to include("Amount")
        expect(header_line).to include("Currency")
        expect(header_line).to include("Status")
        expect(header_line).to include("Notes")
      end

      it "includes payment notes in the CSV" do
        get "/api/v1/payments/bulk_download", params: { ids: payment1.id.to_s }

        expect(response.body).to include("First payment")
      end

      it "includes transaction type in humanized form" do
        get "/api/v1/payments/bulk_download", params: { ids: payment1.id.to_s }

        expect(response.body).to include("Bank transfer")
      end
    end
  end
end
