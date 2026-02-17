# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices#update", type: :request do
  let(:company) do
    create(:company_with_invoices)
  end

  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "invoice updation" do
      it "updates invoice successfully" do
        send_request :patch, api_v1_invoice_path(
          id: company.invoices.first.id, params: {
            invoice: {
              reference: "foo"
            }
          }), headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["reference"]).to eq("foo")
      end

      context "when client doesn't exist" do
        it "throws 404" do
          send_request :patch, api_v1_invoice_path(
            id: company.invoices.first.id, params: {
              invoice: {
                client_id: 100000,
                reference: "foo"
              }
            }), headers: auth_headers(user)
          expect(response).to have_http_status(:not_found)
        end
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :patch, api_v1_invoice_path(
        id: company.invoices.first.id, params: {
          invoice: {
            reference: "foo"
          }
        }), headers: auth_headers(user)
    end

    it "is not be permitted to update an invoice" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :patch, api_v1_invoice_path(
        id: company.invoices.first.id, params: {
          invoice: {
            reference: "foo"
          }
        }), headers: auth_headers(user)
    end

    it "is not be permitted to update an invoice" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to update an invoice" do
      send_request :patch, api_v1_invoice_path(
        id: company.invoices.first.id, params: {
          invoice: {
            reference: "foo"
          }
        })
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
