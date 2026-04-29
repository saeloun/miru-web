# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Payments#withdraw", type: :request do
  let(:company) { create(:india_company, base_currency: "INR") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, currency: "INR") }
  let(:invoice) { create(:invoice, company:, client:, currency: "INR", status: "paid") }
  let(:payment) { create(:payment, invoice:, transaction_type: :razorpay, payment_currency: "INR") }

  before do
    create(:employment, company:, user:)
    sign_in user
  end

  context "when user is an admin" do
    before { user.add_role :admin, company }

    it "routes to the withdraw action" do
      expect(Rails.application.routes.recognize_path(
        "/api/v1/payments/#{payment.id}/withdraw",
        method: :post
      )).to include(
        controller: "api/v1/payments",
        action: "withdraw",
        id: payment.id.to_s
      )
    end

    it "creates a manual Razorpay withdrawal" do
      payout = create(
        :razorpay_payout,
        payment:,
        status: :queued,
        triggered_by: :manual,
        external_id: "pout_test_123"
      )
      service = instance_double(PaymentProviders::RazorpayWithdrawalService, process: payout)

      allow(PaymentProviders::RazorpayWithdrawalService).to receive(:new)
        .with(payment:, requested_by: user, automatic: false)
        .and_return(service)

      post withdraw_api_v1_payment_path(payment), headers: auth_headers(user)

      expect(response).to have_http_status(:accepted)
      expect(json_response.dig("payout", "status")).to eq("queued")
      expect(json_response.dig("payout", "externalId")).to eq("pout_test_123")
    end

    it "returns validation errors from the withdrawal service" do
      service = instance_double(PaymentProviders::RazorpayWithdrawalService)

      allow(PaymentProviders::RazorpayWithdrawalService).to receive(:new)
        .with(payment:, requested_by: user, automatic: false)
        .and_return(service)
      allow(service).to receive(:process)
        .and_raise(PaymentProviders::RazorpayWithdrawalService::Error, "Razorpay payouts are not enabled")

      post withdraw_api_v1_payment_path(payment), headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq("Razorpay payouts are not enabled")
    end
  end

  context "when user is a book keeper" do
    before { user.add_role :book_keeper, company }

    it "returns forbidden" do
      post withdraw_api_v1_payment_path(payment), headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end
  end
end
