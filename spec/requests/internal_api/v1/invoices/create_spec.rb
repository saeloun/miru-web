# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#create", type: :request do
  let(:company) do
    create(:company, clients: create_list(:client_with_invoices, 5))
  end

  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "invoice creation" do
      let(:invoice) {
        attributes_for(
          :invoice,
          invoice_number: "SAI-C1-03",
          client: company.clients.first,
          client_id: company.clients.first.id,
          status: :draft,
          invoice_line_item: {
            name: "Test",
            description: "test description",
            data: Faker::Date.in_date_period,
            rate: 12.4,
            quantity: 34.54
          }
        )
      }

      it "creates invoice successfully & reindex it" do
        send_request :post, internal_api_v1_invoices_path(invoice:), headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expected_attrs =
          ["amount", "amountDue", "amountPaid", "client", "discount", "dueDate",
           "id", "invoiceLineItems", "invoiceNumber", "issueDate",
           "outstandingAmount", "reference", "status", "stripeEnabled", "tax"]
        expect(json_response.keys.sort).to match(expected_attrs)
        Invoice.reindex
        assert_equal ["SAI-C1-03"], Invoice.search("SAI-C1-03").map(&:invoice_number)
      end

      context "when client doesn't exist" do
        it "throws 404" do
          send_request :post, internal_api_v1_invoices_path(
            invoice: {
              client_id: 100000,
              invoice_number: "INV0001",
              reference: "bar",
              issue_date: "2022-01-01",
              due_date: "2022-01-31"
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
      send_request :post, internal_api_v1_invoices_path(
        invoice: attributes_for(
          :invoice,
          client: company.clients.first,
          client_id: company.clients.first.id,
          status: :draft,
          invoice_line_item: {
            name: "Test",
            description: "test description",
            data: Faker::Date.in_date_period,
            rate: 12.4,
            quantity: 34.54
          }
        )
      ), headers: auth_headers(user)
    end

    it "is not be permitted to generate an invoice" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :post, internal_api_v1_invoices_path(
        invoice: attributes_for(
          :invoice,
          client: company.clients.first,
          client_id: company.clients.first.id,
          status: :draft,
          invoice_line_item: {
            name: "Test",
            description: "test description",
            data: Faker::Date.in_date_period,
            rate: 12.4,
            quantity: 34.54
          }
        )
      ), headers: auth_headers(user)
    end

    it "is not be permitted to generate an invoice" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to generate an invoice" do
      send_request :post, internal_api_v1_invoices_path(
        invoice: attributes_for(
          :invoice,
          client: company.clients.first,
          client_id: company.clients.first.id,
          status: :draft
        )
      )
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
