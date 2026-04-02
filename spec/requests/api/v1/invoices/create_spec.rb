# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices#create", type: :request do
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
          invoice_line_item: {
            name: "Test",
            description: "test description",
            data: Faker::Date.in_date_period,
            rate: 12.4,
            quantity: 34.54
          }
        )
      }

      it "creates invoice successfully" do
        send_request :post, api_v1_invoices_path(invoice:), headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expected_attrs =
          ["amount", "amountDue", "amountPaid", "baseCurrencyAmount", "client", "discount", "dueDate",
           "id", "invoiceLineItems", "invoiceNumber", "issueDate",
           "outstandingAmount", "reference", "status", "stripeEnabled", "tax"]
        expect(json_response.keys.sort).to match(expected_attrs)
        # Verify searchable immediately without reindex
        assert_equal ["SAI-C1-03"], Invoice.search("SAI-C1-03").map(&:invoice_number)
      end

      it "creates invoice line items with date and timesheet entry associations" do
        client = company.clients.first
        project = create(:project, client:)
        timesheet_entry = create(
          :timesheet_entry,
          user:,
          project:,
          work_date: Date.current,
          duration: 120
        )

        send_request :post, api_v1_invoices_path(
          invoice: {
            client_id: client.id,
            invoice_number: "INV-TIMESHEET-001",
            issue_date: Date.current.iso8601,
            due_date: 30.days.from_now.to_date.iso8601,
            status: "draft",
            currency: company.base_currency,
            invoice_line_items_attributes: [
              {
                name: "Timesheet entry",
                description: "Linked entry",
                date: timesheet_entry.work_date.iso8601,
                rate: 100,
                quantity: 120,
                timesheet_entry_id: timesheet_entry.id
              }
            ]
          }), headers: auth_headers(user)

        expect(response).to have_http_status(:ok)

        invoice = Invoice.find_by!(invoice_number: "INV-TIMESHEET-001")
        line_item = invoice.invoice_line_items.last

        expect(line_item.date).to eq(timesheet_entry.work_date)
        expect(line_item.timesheet_entry_id).to eq(timesheet_entry.id)
      end

      it "rejects timesheet entries from another company" do
        client = company.clients.first
        other_company = create(:company)
        other_client = create(:client, company: other_company)
        other_project = create(:project, client: other_client)
        other_user = create(:user, current_workspace_id: other_company.id)
        create(:employment, company: other_company, user: other_user)
        other_timesheet_entry = create(
          :timesheet_entry,
          user: other_user,
          project: other_project,
          work_date: Date.current,
          duration: 60
        )

        send_request :post, api_v1_invoices_path(
          invoice: {
            client_id: client.id,
            invoice_number: "INV-CROSS-WORKSPACE-001",
            issue_date: Date.current.iso8601,
            due_date: 30.days.from_now.to_date.iso8601,
            status: "draft",
            currency: company.base_currency,
            invoice_line_items_attributes: [
              {
                name: "Cross workspace entry",
                description: "Should fail",
                date: other_timesheet_entry.work_date.iso8601,
                rate: 100,
                quantity: 60,
                timesheet_entry_id: other_timesheet_entry.id
              }
            ]
          }), headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.body).to include("same company")
      end

      context "when client doesn't exist" do
        it "throws 404" do
          send_request :post, api_v1_invoices_path(
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
      send_request :post, api_v1_invoices_path(
        invoice: attributes_for(
          :invoice,
          client: company.clients.first,
          client_id: company.clients.first.id,
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
      send_request :post, api_v1_invoices_path(
        invoice: attributes_for(
          :invoice,
          client: company.clients.first,
          client_id: company.clients.first.id,
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
      send_request :post, api_v1_invoices_path(
        invoice: attributes_for(
          :invoice,
          client: company.clients.first,
          client_id: company.clients.first.id
        )
      )
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
