# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Payments#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client, company:, name: "bob") }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when adds the manual payment entry with total invoice amount" do
      let!(:client1_sent_invoice1) { create(
        :invoice,
        company:,
        client: client1,
        status: "sent",
        amount: 100,
        amount_due: 100,
        amount_paid: 0
        )
      }

      before do
        @payment = {
          invoice_id: client1_sent_invoice1.id,
          transaction_date: Date.current,
          transaction_type: "visa",
          amount: 100,
          note: "This is transaction ID - 123"
        }
        send_request :post, api_v1_payments_path(payment: @payment), headers: auth_headers(user)
      end

      it "return the success" do
        expect(response).to have_http_status(:created)
      end

      it "adds the payment entry to the database" do
        expect(Payment.last.invoice.id).to eq(client1_sent_invoice1.id)
      end

      it "returns the expected payment entry response" do
        expected_payment_response = {
          invoiceNumber: client1_sent_invoice1.invoice_number,
          transactionDate: Date.current,
          note: @payment[:note],
          transactionType: @payment[:transaction_type],
          clientName: client1.name,
          amount: @payment[:amount].to_f.to_s,
          status: "paid"
        }
        expect(json_response["payment"].except("id")).to eq(JSON.parse(expected_payment_response.to_json))
        expect(json_response["baseCurrency"]).to eq(company.base_currency)
      end

      it "updates the invoice details correctly in the database" do
        client1_sent_invoice1.reload
        expect(client1_sent_invoice1.amount_due).to eq(0)
        expect(client1_sent_invoice1.amount_paid).to eq(100)
        expect(client1_sent_invoice1.status).to eq("paid")
      end
    end

    context "when adds the manual payment entry with partial invoice amount" do
      let!(:client1_sent_invoice1) { create(
        :invoice,
        company:,
        client: client1,
        status: "sent",
        amount: 100,
        amount_due: 100,
        amount_paid: 0
        )
      }

      before do
        @payment = {
          invoice_id: client1_sent_invoice1.id,
          transaction_date: Date.current,
          transaction_type: "visa",
          amount: 80,
          note: "This is transaction ID - 123"
        }
        send_request :post, api_v1_payments_path(payment: @payment), headers: auth_headers(user)
      end

      it "sets the payment status as partial" do
        expect(Payment.last.status).to eq("partially_paid")
      end

      it "updates the invoice details correctly in the database" do
        client1_sent_invoice1.reload
        expect(client1_sent_invoice1.amount_due).to eq(20)
        expect(client1_sent_invoice1.amount_paid).to eq(80)
        expect(client1_sent_invoice1.status).to eq("sent")
      end
    end
  end

  context "when user is an employee" do
    let!(:client1_sent_invoice1) {
      create(
        :invoice,
        company:,
        client: client1,
        status: "sent",
        amount: 100,
        amount_due: 100,
        amount_paid: 0
      )
    }

    before do
      @payment = {
        invoice_id: client1_sent_invoice1.id,
        transaction_date: Date.current,
        transaction_type: "visa",
        amount: 80,
        note: "This is transaction ID - 123"
      }
      create(:employment, company:, user:)
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
    let!(:client1_sent_invoice1) {
      create(
        :invoice,
        company:,
        client: client1,
        status: "sent",
        amount: 100,
        amount_due: 100,
        amount_paid: 0
      )
    }

    before do
      @payment = {
        invoice_id: client1_sent_invoice1.id,
        transaction_date: Date.current,
        transaction_type: "visa",
        amount: 80,
        note: "This is transaction ID - 123"
      }
      create(:employment, company:, user:)
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
