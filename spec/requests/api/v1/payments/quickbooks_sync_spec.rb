# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Payments#quickbooks_sync", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:invoice) { create(:invoice, company:) }
  let(:payment) { create(:payment, invoice:) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user

    allow(QuickBooks::Configuration).to receive(:environment).and_return("sandbox")
  end

  it "queues a QuickBooks payment export" do
    connection = create(:quickbooks_connection, company:)

    expect {
      post "/api/v1/payments/#{payment.id}/quickbooks_sync", headers: auth_headers(user)
    }.to have_enqueued_job(QuickBooks::ExportPaymentJob).with(connection.id, payment.id, "manual")

    expect(response).to have_http_status(:accepted)
    expect(json_response.dig("quickbooks", "sync")).to include(
      "status" => "queued",
      "recordType" => "Payment",
      "recordId" => payment.id
    )
  end

  it "returns an error when QuickBooks is not connected" do
    post "/api/v1/payments/#{payment.id}/quickbooks_sync", headers: auth_headers(user)

    expect(response).to have_http_status(:not_found)
    expect(json_response["errors"]).to eq("Connect QuickBooks before syncing payments")
  end

  it "rejects book keepers" do
    user.remove_role :admin, company
    user.add_role :book_keeper, company
    create(:quickbooks_connection, company:)

    post "/api/v1/payments/#{payment.id}/quickbooks_sync", headers: auth_headers(user)

    expect(response).to have_http_status(:forbidden)
  end
end
