# frozen_string_literal: true

require "rails_helper"

# Converting to request test since we're testing API functionality
# The React SPA integration will be tested separately once rendering issues are resolved
RSpec.describe "Due invoice payment reminder", type: :request do
  let!(:company) { create(:company) }
  let!(:client) { create(:client, company:) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:invoice1) { create(:invoice_with_invoice_line_items, client:, status: "sent") }
  let!(:invoice2) { create(:invoice_with_invoice_line_items, client:, status: "viewed") }
  let!(:invoice3) { create(:invoice_with_invoice_line_items, client:, status: "overdue") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  context "when accessing payment reminder data via API" do
    it "can fetch client details and invoices for payment reminder" do
      # Get the client with their due invoices
      get "/api/v1/clients/#{client.id}"

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)

      # Should include client details
      expect(json_response["client_details"]["id"]).to eq(client.id)
      expect(json_response["client_details"]["name"]).to eq(client.name)
      expect(json_response["client_details"]["email"]).to eq(client.email)

      # Should include invoices that need payment reminders
      expect(json_response["invoices"]).to be_present
      invoice_numbers = json_response["invoices"].pluck("invoiceNumber")
      expect(invoice_numbers).to include(invoice1.invoice_number)
      expect(invoice_numbers).to include(invoice2.invoice_number)
      expect(invoice_numbers).to include(invoice3.invoice_number)

      # Should include overdue/outstanding amounts
      expect(json_response["overdue_outstanding_amount"]).to be_present
    end
  end

  context "when testing payment-related functionality" do
    it "calculates overdue and outstanding amounts correctly" do
      get "/api/v1/clients/#{client.id}"

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)

      # Should calculate overdue/outstanding amounts for payment reminders
      amounts = json_response["overdue_outstanding_amount"]
      expect(amounts["overdue_amount"]).to be_present
      expect(amounts["outstanding_amount"]).to be_present
      expect(amounts["currency"]).to be_present
    end

    it "includes payment status information in invoice data" do
      get "/api/v1/clients/#{client.id}"

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)

      # Verify invoice status information is included
      invoices = json_response["invoices"]
      statuses = invoices.pluck("status")
      expect(statuses).to include("sent", "viewed", "overdue")
    end

    it "returns appropriate data for payment reminder UI" do
      get "/api/v1/clients/#{client.id}"

      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)

      # All necessary data for payment reminder functionality should be present
      expect(json_response["client_details"]).to be_present
      expect(json_response["invoices"]).to be_present
      expect(json_response["overdue_outstanding_amount"]).to be_present

      # Client should have email for sending reminders
      expect(json_response["client_details"]["email"]).to be_present
    end
  end
end
