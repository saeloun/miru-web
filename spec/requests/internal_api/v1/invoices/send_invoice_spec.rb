# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#send_invoice", type: :request do
  let(:client) { create :client_with_invoices }
  let(:company) { client.company }
  let(:invoice) { client.invoices.first }
  let(:user) { create :user, current_workspace_id: company.id }

  context "when user is signed in" do
    before do
      create(:company_user, company:, user:)
    end

    let(:invoice_email) do
      { subject: "Some Subject", recipients: [client.email, "miru@example.com"], body: "You have an invoice!" }
    end

    context "when user is an admin" do
      before do
        user.add_role :admin, company
        sign_in user
      end

      it "returns a 202 response" do
        post send_invoice_internal_api_v1_invoice_path(id: invoice.id), params: { invoice_email: }

        expect(response).to have_http_status :accepted
        expect(json_response["message"]).to eq("Invoice will be sent!")
      end

      it "enqueues an email for delivery" do
        expect do
          post send_invoice_internal_api_v1_invoice_path(id: invoice.id), params: { invoice_email: }
        end.to have_enqueued_mail(InvoiceMailer, :invoice)
      end

      context "when invoice doesn't exist" do
        it "returns 404 response" do
          post send_invoice_internal_api_v1_invoice_path(id: "random")

          expect(response).to have_http_status :not_found
          expect(json_response["errors"]).to eq "Couldn't find Invoice with 'id'=random"
        end
      end
    end

    context "when user is an employee" do
      before do
        user.add_role :employee, company
        sign_in user
      end

      it "returns a 403 response" do
        post send_invoice_internal_api_v1_invoice_path(id: invoice.id)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when user is logged out" do
    it "returns a 401 response" do
      post send_invoice_internal_api_v1_invoice_path(id: invoice.id)

      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
