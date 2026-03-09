# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Reports::OutstandingOverdueInvoicesController::#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client, :with_logo, company:, name: "bob") }
  let!(:client2) { create(:client, :with_logo, company:, name: "alpha") }
  let!(:client1_sent_invoice1) { create(:invoice, client: client1, status: "sent") }
  let!(:client1_sent_invoice2) { create(:invoice, client: client1, status: "sent") }
  let!(:client1_viewed_invoice1) { create(:invoice, client: client1, status: "viewed") }
  let(:client1_paid_invoice2) { create(:invoice, client: client1, status: "paid") }
  let!(:client2_sent_invoice1) { create(:invoice, client: client2, status: "sent") }
  let!(:client2_overdue_invoice1) { create(:invoice, client: client2, status: "overdue") }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when outstanding and overdue invoices reports page's request is made" do
      before do
        @client1_outstanding_amount = client1_sent_invoice1.amount + client1_sent_invoice2.amount +
                                      client1_viewed_invoice1.amount
        @client1_overdue_amount = 0
        @client2_outstanding_amount = client2_sent_invoice1.amount
        @client2_overdue_amount = client2_overdue_invoice1.amount
        @expected_clients =
          [{
            name: client2.name,
            logo: client2.logo_url,
            totalOutstandingAmount: @client2_outstanding_amount,
            totalOverdueAmount: @client2_overdue_amount,
            invoices: [
                        {
                          clientName: client2.name,
                          invoiceNo: client2_overdue_invoice1.invoice_number,
                          issueDate: client2_overdue_invoice1.formatted_issue_date,
                          dueDate: client2_overdue_invoice1.formatted_due_date,
                          amount: client2_overdue_invoice1.amount,
                          status: client2_overdue_invoice1.status,
                          currency: client2_overdue_invoice1.currency
                        },
                        {
                          clientName: client2.name,
                          invoiceNo: client2_sent_invoice1.invoice_number,
                          issueDate: client2_sent_invoice1.formatted_issue_date,
                          dueDate: client2_sent_invoice1.formatted_due_date,
                          amount: client2_sent_invoice1.amount,
                          status: client2_sent_invoice1.status,
                          currency: client2_sent_invoice1.currency
                        }
                      ].sort_by { |k| Date.strptime(k[:issueDate], "%m.%d.%Y") }.reverse
          },
           {
             name: client1.name,
             logo: client1.logo_url,
             totalOutstandingAmount: @client1_outstanding_amount,
             totalOverdueAmount: @client1_overdue_amount,
             invoices: [
                        {
                          clientName: client1.name,
                          invoiceNo: client1_viewed_invoice1.invoice_number,
                          issueDate: client1_viewed_invoice1.formatted_issue_date,
                          dueDate: client1_viewed_invoice1.formatted_due_date,
                          amount: client1_viewed_invoice1.amount,
                          status: client1_viewed_invoice1.status,
                          currency: client1_viewed_invoice1.currency
                        },
                        {
                          clientName: client1.name,
                          invoiceNo: client1_sent_invoice2.invoice_number,
                          issueDate: client1_sent_invoice2.formatted_issue_date,
                          dueDate: client1_sent_invoice2.formatted_due_date,
                          amount: client1_sent_invoice2.amount,
                          status: client1_sent_invoice2.status,
                          currency: client1_sent_invoice2.currency
                        },
                        {
                          clientName: client1.name,
                          invoiceNo: client1_sent_invoice1.invoice_number,
                          issueDate: client1_sent_invoice1.formatted_issue_date,
                          dueDate: client1_sent_invoice1.formatted_due_date,
                          amount: client1_sent_invoice1.amount,
                          status: client1_sent_invoice1.status,
                          currency: client1_sent_invoice1.currency
                        }
                      ].sort_by { |k| Date.strptime(k[:issueDate], "%m.%d.%Y") }.reverse
           }]
        get internal_api_v1_reports_outstanding_overdue_invoices_path, headers: auth_headers(user)
      end

      it "returns the 200 http response" do
        expect(response).to have_http_status(:ok)
      end

      it "returns the clients data in alaphabetical order with invoices details" do
        expect(
          json_response["clients"][0]
                  .except("invoices")).to eq(
                    JSON.parse(@expected_clients.first.except(:invoices).to_json))
        expect(
          json_response["clients"][1]
                  .except("invoices")).to eq(JSON.parse(@expected_clients.last.except(:invoices).to_json))
      end

      it "returns the correct invoices for each client" do
        expect(
          json_response["clients"][0]
                  .slice("invoices")).to include(JSON.parse(@expected_clients.first.slice(:invoices).to_json))
        expect(
          json_response["clients"][0]
                  .slice("invoices")["invoices"].count).to eq(@expected_clients.first.slice(:invoices)[:invoices].count)
        expect(
          json_response["clients"][1]
                  .slice("invoices")).to include(JSON.parse(@expected_clients.last.slice(:invoices).to_json))
        expect(
          json_response["clients"][1]
                  .slice("invoices")["invoices"].count).to eq(@expected_clients.last.slice(:invoices)[:invoices].count)
      end

      it "returns the base currency" do
        expect(json_response["currency"]).to eq(company.base_currency)
      end

      it "returns the summary of all clients invoices" do
        expected_summary = {
          totalOutstandingAmount: @client1_outstanding_amount + @client2_outstanding_amount,
          totalOverdueAmount: @client1_overdue_amount + @client2_overdue_amount,
          totalInvoiceAmount: @client1_outstanding_amount + @client2_outstanding_amount +
                                @client1_overdue_amount + @client2_overdue_amount
        }
        expect(json_response["summary"]).to eq(JSON.parse(expected_summary.to_json))
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_reports_outstanding_overdue_invoices_path, headers: auth_headers(user)
    end

    it "is not permitted to view outstanding and overdue invoices report" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, internal_api_v1_reports_outstanding_overdue_invoices_path, headers: auth_headers(user)
    end

    it "is permitted to view outstanding and overdue invoices report" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view outstanding and overdue invoices report" do
      send_request :get, internal_api_v1_reports_outstanding_overdue_invoices_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
