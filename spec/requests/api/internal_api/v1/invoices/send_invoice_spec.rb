# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices#send_invoice", type: :request do
  let(:invoice) { create :invoice_with_invoice_line_items }
  let(:overdue_invoice) { create :invoice, status: "overdue" }
  let(:client) { invoice.client }
  let(:company) { invoice.company }
  let(:user) { create :user, current_workspace_id: company.id }

  before do
    allow(Current).to receive(:user).and_return(user)
    allow(Current).to receive(:company).and_return(company)
  end

  context "when user is signed in" do
    before do
      create(:employment, company:, user:)
    end

    let(:invoice_email) do
      { subject: "Some Subject", recipients: [client.email, "miru@example.com"], message: "You have an invoice!" }
    end

    context "when user is an admin" do
      before do
        user.add_role :admin, company
        sign_in user
      end

      it "returns a 200 response" do
        post send_invoice_api_v1_invoice_path(id: invoice.id), params: { invoice_email: },
          headers: auth_headers(user)

        expect(response).to have_http_status :ok
        expect(json_response["message"]).to eq("Invoice has been sent successfully")
      end

      it "enqueues an email for delivery" do
        expect do
          post send_invoice_api_v1_invoice_path(id: invoice.id), params: { invoice_email: },
            headers: auth_headers(user)
        end.to have_enqueued_mail(InvoiceMailer, :send_invoice)
      end

      it "changes invoice status to sent when invoice is draft" do
        expect do
          post send_invoice_api_v1_invoice_path(id: invoice.id), params: { invoice_email: },
            headers: auth_headers(user)
        end.to have_enqueued_mail(InvoiceMailer, :send_invoice)
        expect(invoice.reload.status).to eq("sent")
      end

      it "does not change the invoice status to sent after sending" do
        post send_invoice_api_v1_invoice_path(id: overdue_invoice.id), params: { invoice_email: },
          headers: auth_headers(user)
        expect(overdue_invoice.reload.status).to eq("overdue")
      end

      context "when invoice doesn't exist" do
        it "returns 404 response" do
          post send_invoice_api_v1_invoice_path(id: "random"), headers: auth_headers(user)

          expect(response).to have_http_status :not_found
          expect(json_response["errors"]).to include "Couldn't find Invoice"
        end
      end
    end

    context "when user is an employee" do
      before do
        user.add_role :employee, company
        sign_in user
      end

      it "returns a 403 response" do
        post send_invoice_api_v1_invoice_path(id: invoice.id), headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is a book keeper" do
      before do
        user.add_role :book_keeper, company
        sign_in user
      end

      it "returns a 403 response" do
        post send_invoice_api_v1_invoice_path(id: invoice.id), headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when user is logged out" do
    it "returns a 401 response" do
      post send_invoice_api_v1_invoice_path(id: invoice.id)

      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
