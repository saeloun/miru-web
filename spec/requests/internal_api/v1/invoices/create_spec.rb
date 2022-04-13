# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#create", type: :request do
  let(:company) do
    create(:company, clients: create_list(:client_with_invoices, 5))
  end

  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "invoice creation" do
      it "creates invoice successfully" do
        send_request :post, internal_api_v1_invoices_path(
          invoice: {
            client_id: 1,
            invoice_number: "INV0001",
            reference: "bar",
            issue_date: "2022-01-01",
            due_date: "2022-01-31"
          })
        expect(response).to have_http_status(:ok)
        expect(json_response["invoiceNumber"]).to eq("INV0001")
        expect(json_response["issueDate"]).to eq("2022-01-01")
        expect(json_response["dueDate"]).to eq("2022-01-31")
        expect(json_response["status"]).to eq("draft")
      end

      it "throws 422 if client doesn't exist" do
        send_request :post, internal_api_v1_invoices_path(
          invoice: {
            client_id: 100000,
            invoice_number: "INV0001",
            reference: "bar",
            issue_date: "2022-01-01",
            due_date: "2022-01-31"
          })
        expect(response).to have_http_status(:unprocessable_entity)
        expect(json_response["errors"]["client"].first).to eq("must exist")
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :post, internal_api_v1_invoices_path
    end

    it "is not be permitted to generate an invoice" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to generate an invoice" do
      send_request :post, internal_api_v1_invoices_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
