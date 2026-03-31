# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Reports::PaymentsController::#index", type: :request do
  let(:company) { create(:company, plan_tier: "paid") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client, company:, name: "Alpha Payments") }
  let!(:client2) { create(:client, company:, name: "Beta Payments") }
  let!(:invoice1) { create(:invoice, company:, client: client1, status: :paid, amount: 2000, amount_paid: 2000, amount_due: 0) }
  let!(:invoice2) { create(:invoice, company:, client: client2, status: :paid, amount: 3000, amount_paid: 3000, amount_due: 0) }
  let!(:matching_payment) do
    create(
      :payment,
      invoice: invoice1,
      amount: 500,
      transaction_type: :visa,
      status: :paid,
      transaction_date: Date.current
    )
  end
  let!(:other_payment) do
    create(
      :payment,
      invoice: invoice2,
      amount: 900,
      transaction_type: :bank_transfer,
      status: :failed,
      transaction_date: 2.days.ago
    )
  end

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  it "filters payments by date, client, payment method, and status" do
    send_request :get, api_v1_reports_payments_path,
      params: {
        from: Date.current.iso8601,
        to: Date.current.iso8601,
        client_ids: client1.id.to_s,
        payment_method: "visa",
        status: "paid"
      },
      headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response["payments"].pluck("id")).to eq([matching_payment.id])
    expect(json_response["summary"]["payment_count"]).to eq(1)
    expect(json_response["filterOptions"]["clients"].pluck("name")).to include(client1.name, client2.name)
  end
end
