# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#update", type: :request do
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

    describe "invoice updation" do
      it "updates invoice successfully" do
        send_request :patch, internal_api_v1_invoice_path(
          id: company.clients.first.invoices.first.id, params: {
            invoice: {
              reference: "foo"
            }
          })
        expect(response).to have_http_status(:ok)
        expect(json_response["reference"]).to eq("foo")
      end

      it "throws 422 if client doesn't exist" do
        send_request :patch, internal_api_v1_invoice_path(
          id: company.clients.first.invoices.first.id, params: {
            invoice: {
              client_id: 100000,
              reference: "foo"
            }
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
      send_request :patch, internal_api_v1_invoice_path(id: company.clients.first.invoices.first.id)
    end

    it "is not be permitted to update an invoice" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to update an invoice" do
      send_request :patch, internal_api_v1_invoice_path(id: 1)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
