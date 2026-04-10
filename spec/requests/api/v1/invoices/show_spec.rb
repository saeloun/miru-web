# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices#show", type: :request do
  let(:company) do
    create(:company_with_invoices)
  end

  let(:user) { create(:user, email: "invoice-show-admin@example.com", current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "returns the invoice" do
      send_request :get, api_v1_invoice_path(company.invoices.first.id), headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
    end

    it "returns the client's current currency for a reopened draft invoice" do
      company.update!(base_currency: "USD")
      client = create(:client, company:, currency: "USD")
      invoice = create(
        :invoice,
        company:,
        client:,
        status: :draft,
        currency: "USD",
        amount: 300,
        base_currency_amount: 300
      )

      allow(CurrencyConversionService).to receive(:get_exchange_rate)
        .with("EUR", "USD", kind_of(Date))
        .and_return(1.2)

      client.update!(currency: "EUR")

      send_request :get, api_v1_invoice_path(invoice.id), headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(invoice.reload.currency).to eq("USD")
      expect(json_response["currency"]).to eq("EUR")
      expect(json_response.dig("client", "currency")).to eq("EUR")
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "is not permitted to view time entry report" do
      send_request :get, api_v1_invoice_path(company.invoices.first.id), headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    it "is permitted to view time entry report" do
      send_request :get, api_v1_invoice_path(company.invoices.first.id), headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
    end
  end

  context "when user is a client" do
    let(:user) { create(:user, email: "invoice-show-client@example.com", current_workspace_id: company.id) }
    let(:invoice) { company.invoices.first }

    before do
      create(:client_member, company:, client: invoice.client, user:)
      user.add_role :client, company
      sign_in user
    end

    it "omits company financial details from the invoice payload" do
      company.update!(
        bank_name: "QA Bank",
        bank_account_number: "12345678",
        bank_routing_number: "987654321",
        bank_swift_code: "QABKUS33",
        tax_id: "TAX-123",
        vat_number: "VAT-123",
        gst_number: "GST-123"
      )

      send_request :get, api_v1_invoice_path(invoice.id), headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("company", "bankName")).to be_nil
      expect(json_response.dig("company", "bankAccountNumber")).to be_nil
      expect(json_response.dig("company", "bankRoutingNumber")).to be_nil
      expect(json_response.dig("company", "bankSwiftCode")).to be_nil
      expect(json_response.dig("company", "taxId")).to be_nil
      expect(json_response.dig("company", "vatNumber")).to be_nil
      expect(json_response.dig("company", "gstNumber")).to be_nil
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view time entry report" do
      send_request :get, api_v1_invoice_path(company.invoices.first.id)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
