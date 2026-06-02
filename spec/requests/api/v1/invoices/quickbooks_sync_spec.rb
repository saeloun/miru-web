# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices#quickbooks_sync", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:invoice) { create(:invoice, company:) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user

    allow(QuickBooks::Configuration).to receive(:environment).and_return("sandbox")
  end

  it "queues a QuickBooks invoice export" do
    connection = create(:quickbooks_connection, company:)

    expect {
      post "/api/v1/invoices/#{invoice.id}/quickbooks_sync", headers: auth_headers(user)
    }.to have_enqueued_job(QuickBooks::ExportInvoiceJob).with(connection.id, invoice.id, "manual")

    expect(response).to have_http_status(:accepted)
    expect(json_response.dig("quickbooks", "sync")).to include(
      "status" => "queued",
      "recordType" => "Invoice",
      "recordId" => invoice.id
    )
  end

  it "returns an error when QuickBooks is not connected" do
    post "/api/v1/invoices/#{invoice.id}/quickbooks_sync", headers: auth_headers(user)

    expect(response).to have_http_status(:not_found)
    expect(json_response["errors"]).to eq("Connect QuickBooks before syncing invoices")
  end

  it "rejects book keepers" do
    user.remove_role :admin, company
    user.add_role :book_keeper, company
    create(:quickbooks_connection, company:)

    post "/api/v1/invoices/#{invoice.id}/quickbooks_sync", headers: auth_headers(user)

    expect(response).to have_http_status(:forbidden)
  end
end
