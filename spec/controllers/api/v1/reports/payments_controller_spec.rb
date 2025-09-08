# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::Reports::PaymentsController, type: :request do
  let(:company) { create(:company) }
  let(:client) { create(:client, company: company) }
  let(:project) { create(:project, client: client, company: company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:invoice) { create(:invoice, client: client, company: company) }

  before do
    user.add_role(:admin, company)
    sign_in(user)
  end

  describe "GET /api/v1/reports/payments" do
    context "when payments exist" do
      let!(:payment1) do
        create(:payment,
          invoice: invoice,
          amount: 1000.50,
          transaction_date: Date.current,
          transaction_type: "credit_card",
          status: "paid",
          note: "Payment 1"
        )
      end

      let!(:payment2) do
        create(:payment,
          invoice: invoice,
          amount: 750.25,
          transaction_date: 1.week.ago,
          transaction_type: "bank_transfer",
          status: "paid",
          note: "Payment 2"
        )
      end

      it "returns payment report data" do
        get "/api/v1/reports/payments"

        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)

        expect(json_response["payments"]).to be_an(Array)
        expect(json_response["payments"].length).to eq(2)
        expect(json_response["summary"]).to be_a(Hash)
        expect(json_response["currency"]).to eq(company.base_currency)
        expect(json_response["filterOptions"]).to be_a(Hash)

        # Verify summary calculations
        expect(json_response["summary"]["total_amount"].to_f).to eq(1750.75)
        expect(json_response["summary"]["payment_count"]).to eq(2)
        expect(json_response["summary"]["average_payment"].to_f).to be_within(0.01).of(875.38)
      end

      it "includes payment details in the correct format" do
        get "/api/v1/reports/payments"

        json_response = JSON.parse(response.body)
        payment_data = json_response["payments"].first

        expect(payment_data.keys).to match_array([
          "id", "payment_date", "transaction_id", "payment_method",
          "client_name", "invoice_number", "amount", "notes", "status"
        ])

        expect(payment_data["client_name"]).to eq(client.name)
        expect(payment_data["invoice_number"]).to eq(invoice.invoice_number)
        expect(payment_data["amount"].to_f).to be_in([1000.50, 750.25])
      end
    end

    context "with date range filter" do
      let!(:recent_payment) do
        create(:payment,
          invoice: invoice,
          amount: 500.00,
          transaction_date: Date.current,
          transaction_type: "credit_card"
        )
      end

      let!(:old_payment) do
        create(:payment,
          invoice: invoice,
          amount: 300.00,
          transaction_date: 1.month.ago,
          transaction_type: "bank_transfer"
        )
      end

      it "filters payments by date range" do
        from_date = 1.week.ago.strftime("%d/%m/%Y")
        to_date = Date.current.strftime("%d/%m/%Y")

        get "/api/v1/reports/payments", params: { from: from_date, to: to_date }

        json_response = JSON.parse(response.body)

        expect(json_response["payments"].length).to eq(1)
        expect(json_response["summary"]["total_amount"].to_f).to eq(500.00)
      end
    end

    context "with client filter" do
      let(:another_client) { create(:client, company: company) }
      let(:another_invoice) { create(:invoice, client: another_client, company: company) }

      let!(:client1_payment) do
        create(:payment,
          invoice: invoice,
          amount: 500.00,
          transaction_type: "credit_card"
        )
      end

      let!(:client2_payment) do
        create(:payment,
          invoice: another_invoice,
          amount: 300.00,
          transaction_type: "bank_transfer"
        )
      end

      it "filters payments by client" do
        get "/api/v1/reports/payments", params: { client_ids: client.id.to_s }

        json_response = JSON.parse(response.body)

        expect(json_response["payments"].length).to eq(1)
        expect(json_response["payments"].first["client_name"]).to eq(client.name)
        expect(json_response["summary"]["total_amount"].to_f).to eq(500.00)
      end

      it "filters payments by multiple clients" do
        client_ids = [client.id, another_client.id].join(",")
        get "/api/v1/reports/payments", params: { client_ids: client_ids }

        json_response = JSON.parse(response.body)

        expect(json_response["payments"].length).to eq(2)
        expect(json_response["summary"]["total_amount"].to_f).to eq(800.00)
      end
    end

    context "with payment method filter" do
      let!(:card_payment) do
        create(:payment,
          invoice: invoice,
          amount: 500.00,
          transaction_type: "credit_card"
        )
      end

      let!(:bank_payment) do
        create(:payment,
          invoice: invoice,
          amount: 300.00,
          transaction_type: "bank_transfer"
        )
      end

      it "filters payments by payment method" do
        get "/api/v1/reports/payments", params: { payment_method: "credit_card" }

        json_response = JSON.parse(response.body)

        expect(json_response["payments"].length).to eq(1)
        expect(json_response["payments"].first["payment_method"]).to eq("Credit card")
        expect(json_response["summary"]["total_amount"].to_f).to eq(500.00)
      end
    end

    context "when no payments exist" do
      it "returns empty data with correct structure" do
        get "/api/v1/reports/payments"

        json_response = JSON.parse(response.body)

        expect(json_response["payments"]).to eq([])
        expect(json_response["summary"]["total_amount"]).to eq(0)
        expect(json_response["summary"]["payment_count"]).to eq(0)
        expect(json_response["summary"]["average_payment"]).to eq(0)
        expect(json_response["currency"]).to eq(company.base_currency)
      end
    end

    context "authorization" do
      let(:employee) { create(:user, current_workspace_id: company.id) }

      before do
        employee.add_role(:employee, company)
        sign_in(employee)
      end

      it "denies access to employees" do
        get "/api/v1/reports/payments"

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /api/v1/reports/payments/download" do
    let!(:payment) do
      create(:payment,
        invoice: invoice,
        amount: 1000.50,
        transaction_date: Date.current,
        transaction_type: "credit_card",
        status: "paid",
        note: "Test payment"
      )
    end

    context "CSV download" do
      it "generates CSV file" do
        get "/api/v1/reports/payments/download.csv"

        expect(response).to have_http_status(:ok)
        expect(response.content_type).to eq("text/csv")
        expect(response.headers["Content-Disposition"]).to include("payment_report_")
        expect(response.body).to include("Date,Client,Invoice Number,Payment Method")
        expect(response.body).to include(client.name)
        expect(response.body).to include("1000.5")
      end
    end

    context "PDF download" do
      it "generates PDF file" do
        get "/api/v1/reports/payments/download.pdf"

        expect(response).to have_http_status(:ok)
        expect(response.content_type).to eq("application/pdf")
        expect(response.headers["Content-Disposition"]).to include("payment_report_")
        # Note: PDF generation is not yet implemented, so we just check it doesn't error
      end
    end

    context "with filters" do
      it "downloads filtered data as CSV" do
        from_date = 1.week.ago.strftime("%d/%m/%Y")
        to_date = Date.current.strftime("%d/%m/%Y")

        get "/api/v1/reports/payments/download.csv", params: {
          from: from_date,
          to: to_date,
          client_ids: client.id.to_s
        }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include(client.name)
      end
    end

    context "authorization" do
      let(:employee) { create(:user, current_workspace_id: company.id) }

      before do
        employee.add_role(:employee, company)
        sign_in(employee)
      end

      it "denies download access to employees" do
        get "/api/v1/reports/payments/download.csv"

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  private

    def json_response
      JSON.parse(response.body)
    end
end
