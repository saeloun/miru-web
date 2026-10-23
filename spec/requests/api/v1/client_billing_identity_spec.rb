# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Client billing identity", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }
  let(:client) do
    create(:client, company:, name: "QA display alias",
      legal_name: "Example International Consulting Private Limited",
      email: "primary@example.test", finance_email: "finance@example.test",
      signatory_name: "Asha Núñez", signatory_email: "signer@example.test")
  end
  let(:invoice) { create(:invoice, company:, client:, status: :sent) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  it "supplies billing facts to authenticated client selectors without signatory contacts" do
    client
    send_request :get, api_v1_clients_path, headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    details = json_response.fetch("client_details").find { |row| row["id"] == client.id }
    expect(details).to include("name" => client.name, "legal_name" => client.legal_name, "finance_email" => client.finance_email)
    expect(details).not_to have_key("signatory_email")
  end

  it "carries legal name and finance email through the private invoice response" do
    send_request :get, api_v1_invoice_path(invoice), headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_response.fetch("client")).to include("legalName" => client.legal_name, "financeEmail" => client.finance_email)
    expect(json_response.fetch("client")).not_to have_key("signatoryEmail")
  end

  it "retains billing details after an invoice save and on the edit response" do
    send_request :patch, api_v1_invoice_path(invoice), params: { invoice: { client_id: client.id, reference: "QA edit" } }, headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_response.fetch("client")).to include("legalName" => client.legal_name, "financeEmail" => client.finance_email)

    send_request :get, edit_api_v1_invoice_path(invoice), headers: auth_headers(user)
    expect(response).to have_http_status(:ok)
    expect(json_response.fetch("client")).to include("legalName" => client.legal_name, "financeEmail" => client.finance_email)
  end

  it "exposes the billed-to legal name without finance or signatory contacts on shared invoices" do
    sign_out user
    send_request :get, api_v1_invoices_view_path(invoice.external_view_key)
    expect(response).to have_http_status(:ok)
    expect(json_response.dig("client", "legal_name")).to eq(client.legal_name)
    expect(json_response.fetch("client").keys).not_to include("finance_email", "signatory_email", "signatory_name")
  end
end
