# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices#create", type: :request do
  let_it_be(:company) { create(:company, :with_logo, base_currency: "USD") }
  let_it_be(:client) { create(:client, company:) }
  let(:user) { create(:user, email: "invoice-create-admin@example.com", current_workspace_id: company.id) }

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
          client:,
          client_id: client.id,
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
          ["amount", "amountDue", "amountPaid", "baseCurrencyAmount", "client", "currency", "discount", "dueDate",
           "company", "id", "invoiceLineItems", "invoiceNumber", "issueDate",
           "outstandingAmount", "reference", "status", "stripeEnabled", "tax"]
        expect(json_response.keys.sort).to match_array(expected_attrs)
        # Verify searchable immediately without reindex
        assert_equal ["SAI-C1-03"], Invoice.search("SAI-C1-03").map(&:invoice_number)
      end

      it "returns company data needed by the editor preview" do
        company.addresses.first.update!(address_line_1: "100 Market St", city: "San Francisco", state: "CA", country: "USA", pin: "94105")
        company.update!(
          business_phone: "+14155552671",
          tax_id: "TAX-123",
          bank_name: "QA Bank",
          bank_account_number: "12345678",
          bank_routing_number: "987654321",
          bank_swift_code: "QABKUS33",
          ein: "12-3456789",
          us_taxpayer_id: "US-TIN-1234"
        )

        send_request :post, api_v1_invoices_path(
          invoice: {
            client_id: client.id,
            invoice_number: "INV-COMPANY-001",
            issue_date: Date.current.iso8601,
            due_date: 30.days.from_now.to_date.iso8601,
            status: "draft",
            currency: company.base_currency,
            invoice_line_items_attributes: [
              {
                name: "Discovery",
                description: "Analysis block",
                date: Date.current.iso8601,
                rate: 100,
                quantity: 120
              }
            ]
          }), headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response.dig("company", "name")).to eq(company.name)
        expect(json_response.dig("company", "phoneNumber")).to eq(company.business_phone)
        expect(json_response.dig("company", "taxId")).to eq(company.tax_id)
        expect(json_response.dig("company", "ein")).to eq(company.ein)
        expect(json_response.dig("company", "usTaxpayerId")).to eq(company.us_taxpayer_id)
        expect(json_response.dig("company", "logo")).to end_with(company.company_logo)
        expect(json_response.dig("company", "bankName")).to eq(company.bank_name)
        expect(json_response.dig("company", "bankAccountNumber")).to eq(company.bank_account_number)
        expect(json_response.dig("company", "bankRoutingNumber")).to eq(company.bank_routing_number)
        expect(json_response.dig("company", "bankSwiftCode")).to eq(company.bank_swift_code)
        expect(
          json_response.dig("company", "address", "addressLine1") ||
          json_response.dig("company", "address", "address_line_1")
        ).to eq(company.current_address.address_line_1)
      end

      it "creates invoice line items with date and timesheet entry associations" do
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

      it "calculates invoice totals from line items, discount, and tax" do
        send_request :post, api_v1_invoices_path(
          invoice: {
            client_id: client.id,
            invoice_number: "INV-TOTALS-001",
            issue_date: Date.current.iso8601,
            due_date: 30.days.from_now.to_date.iso8601,
            status: "draft",
            currency: company.base_currency,
            discount: 25,
            tax: 10,
            invoice_line_items_attributes: [
              {
                name: "Discovery",
                description: "Analysis block",
                date: Date.current.iso8601,
                rate: 100,
                quantity: 120
              },
              {
                name: "QA",
                description: "Validation block",
                date: Date.current.iso8601,
                rate: 90,
                quantity: 60
              }
            ]
          }), headers: auth_headers(user)

        expect(response).to have_http_status(:ok)

        invoice = Invoice.find_by!(invoice_number: "INV-TOTALS-001")
        expect(invoice.amount.to_f).to eq(275.0)
        expect(invoice.amount_due.to_f).to eq(275.0)
        expect(json_response["amount"].to_f).to eq(275.0)
        expect(json_response["amountDue"].to_f).to eq(275.0)
      end

      it "creates an invoice in the client currency and returns it in the response" do
        client.update!(currency: "EUR")
        allow(CurrencyConversionService).to receive(:get_exchange_rate)
          .with("EUR", company.base_currency, kind_of(Date))
          .and_return(1.2)

        send_request :post, api_v1_invoices_path(
          invoice: {
            client_id: client.id,
            invoice_number: "INV-EUR-001",
            issue_date: Date.current.iso8601,
            due_date: 30.days.from_now.to_date.iso8601,
            status: "draft",
            currency: "EUR",
            invoice_line_items_attributes: [
              {
                name: "EUR strategy block",
                description: "Euro invoice",
                date: Date.current.iso8601,
                rate: 150,
                quantity: 120
              }
            ]
          }), headers: auth_headers(user)

        expect(response).to have_http_status(:ok)

        invoice = Invoice.find_by!(invoice_number: "INV-EUR-001")
        expect(invoice.currency).to eq("EUR")
        expect(invoice.amount.to_f).to eq(300.0)
        expect(invoice.base_currency_amount.to_f).to eq(360.0)
        expect(json_response["currency"]).to eq("EUR")
        expect(json_response["baseCurrencyAmount"].to_f).to eq(360.0)
        expect(json_response.dig("client", "currency")).to eq("EUR")
      end

      it "does not create invoices for clients from another workspace" do
        other_company = create(:company)
        other_client = create(:client, company: other_company)

        expect do
          send_request :post, api_v1_invoices_path(
            invoice: {
              client_id: other_client.id,
              invoice_number: "INV-CROSS-WORKSPACE-001",
              issue_date: Date.current.iso8601,
              due_date: 30.days.from_now.to_date.iso8601,
              status: "draft",
              currency: company.base_currency,
              invoice_line_items_attributes: [
                {
                  name: "Cross workspace attempt",
                  description: "Should not persist",
                  date: Date.current.iso8601,
                  rate: 100,
                  quantity: 60
                }
              ]
            }), headers: auth_headers(user)
        end.not_to change(Invoice, :count)

        expect(response).to have_http_status(:not_found)
      end

      it "supports USD, EUR, and INR invoices within the same company" do
        eur_client = create(:client, company:, currency: "EUR", name: "Euro Client")
        inr_client = create(:client, company:, currency: "INR", name: "India Client")

        allow(CurrencyConversionService).to receive(:get_exchange_rate)
          .with("EUR", company.base_currency, kind_of(Date))
          .and_return(1.2)
        allow(CurrencyConversionService).to receive(:get_exchange_rate)
          .with("INR", company.base_currency, kind_of(Date))
          .and_return(0.012)

        [
          [client, "INV-USD-001", "USD", 300.0],
          [eur_client, "INV-EUR-002", "EUR", 360.0],
          [inr_client, "INV-INR-001", "INR", 3.6]
        ].each do |invoice_client, invoice_number, currency_code, expected_base_amount|
          send_request :post, api_v1_invoices_path(
            invoice: {
              client_id: invoice_client.id,
              invoice_number: invoice_number,
              issue_date: Date.current.iso8601,
              due_date: 30.days.from_now.to_date.iso8601,
              status: "draft",
              currency: currency_code,
              invoice_line_items_attributes: [
                {
                  name: "#{currency_code} strategy block",
                  description: "#{currency_code} invoice",
                  date: Date.current.iso8601,
                  rate: 150,
                  quantity: 120
                }
              ]
            }), headers: auth_headers(user)

          expect(response).to have_http_status(:ok)

          created_invoice = Invoice.find_by!(invoice_number:)
          expect(created_invoice.company_id).to eq(company.id)
          expect(created_invoice.currency).to eq(currency_code)
          expect(created_invoice.base_currency_amount.to_f).to eq(expected_base_amount)
        end

        expect(
          Invoice.where(invoice_number: ["INV-USD-001", "INV-EUR-002", "INV-INR-001"]).order(:invoice_number).pluck(:currency)
        ).to eq(["EUR", "INR", "USD"])
      end

      it "rejects timesheet entries from another company" do
        other_company = create(:company)
        other_client = create(:client, company: other_company)
        other_project = create(:project, client: other_client)
        other_user = create(
          :user,
          email: "invoice-create-other-company@example.com",
          current_workspace_id: other_company.id
        )
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
          client:,
          client_id: client.id,
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
          client:,
          client_id: client.id,
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
          client:,
          client_id: client.id
        )
      )
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
