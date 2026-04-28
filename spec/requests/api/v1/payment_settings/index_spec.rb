# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::PaymentSettings#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "returns connected providers" do
      send_request :get, api_v1_payments_settings_path, headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_response["providers"]).to have_key("stripe")
      expect(json_response["providers"]).to have_key("upi")
      expect(json_response["providers"]).to have_key("razorpay")
      expect(json_response["providers"]["stripe"]).to have_key("connected")
      expect(json_response["providers"]["stripe"]["connected"]).to be(false)
      expect(json_response["providers"]["stripe"]["enabled"]).to be(false)
      expect(json_response["providers"]["upi"]["connected"]).to be(false)
      expect(json_response["providers"]["razorpay"]["connected"]).to be(false)
    end

    it "updates UPI payment settings" do
      patch(
        "/api/v1/payments/settings/upi",
        params: {
          provider: {
            enabled: true,
            enabled_on_invoices: true,
            upi_id: "saeloun@upi",
            payee_name: "Saeloun",
            merchant_category_code: "",
            connected: false,
            accepted_payment_methods: ["card"]
          }
        },
        headers: auth_headers(user)
      )

      expect(response).to have_http_status(:ok)
      upi = json_response["providers"]["upi"]
      expect(upi["connected"]).to be(true)
      expect(upi["enabled"]).to be(true)
      expect(upi["upiId"]).to eq("saeloun@upi")
      expect(upi["paymentLink"]).to include("upi://pay?")
      expect(upi["qrCodeSvg"]).to include("<svg")
      expect(upi["qrCodeDataUri"]).to start_with("data:image/svg+xml;base64,")

      provider = company.payments_providers.find_by!(name: PaymentsProvider::UPI_PROVIDER)
      expect(provider.connected).to be(true)
      expect(provider.accepted_payment_methods).to eq(["upi"])
    end

    it "updates Razorpay payment settings without exposing the key secret" do
      patch(
        "/api/v1/payments/settings/razorpay",
        params: {
          provider: {
            enabled: true,
            enabled_on_invoices: true,
            key_id: "rzp_test_123",
            key_secret: "secret",
            linked_account_id: "acc_test_123",
            platform_fee_percent: "5",
            route_transfers_enabled: true
          }
        },
        headers: auth_headers(user)
      )

      expect(response).to have_http_status(:ok)
      razorpay = json_response["providers"]["razorpay"]
      expect(razorpay["connected"]).to be(true)
      expect(razorpay["enabled"]).to be(true)
      expect(razorpay["keyId"]).to eq("rzp_test_123")
      expect(razorpay["keySecretConfigured"]).to be(true)
      expect(razorpay).not_to have_key("keySecret")
      expect(razorpay["linkedAccountId"]).to eq("acc_test_123")
      expect(razorpay["platformFeePercent"]).to eq("5.0")
      expect(razorpay["routeTransfersEnabled"]).to be(true)

      provider = company.payments_providers.find_by!(name: PaymentsProvider::RAZORPAY_PROVIDER)
      expect(provider.accepted_payment_methods).to eq(["razorpay"])
      expect(provider.key_secret).to eq("secret")
      expect(provider.settings["key_secret"]).to be_nil
      expect(provider.settings["key_secret_ciphertext"]).to be_present
    end

    it "rejects invalid UPI IDs" do
      patch(
        "/api/v1/payments/settings/upi",
        params: {
          provider: {
            enabled: true,
            enabled_on_invoices: true,
            upi_id: "not-a-upi-id"
          }
        },
        headers: auth_headers(user)
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to have_key("upi_id")
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "is not be permitted to view payment settings" do
      send_request :get, api_v1_payments_settings_path, headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end

    it "is not permitted to update UPI payment settings" do
      patch(
        "/api/v1/payments/settings/upi",
        params: {
          provider: {
            enabled: true,
            upi_id: "saeloun@upi"
          }
        },
        headers: auth_headers(user)
      )

      expect(response).to have_http_status(:forbidden)
      expect(company.payments_providers.find_by(name: PaymentsProvider::UPI_PROVIDER)).to be_nil
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    it "is not be permitted to view payment settings" do
      send_request :get, api_v1_payments_settings_path, headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to view payment settings" do
      send_request :get, api_v1_payments_settings_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end

    it "is not permitted to update UPI payment settings" do
      patch(
        "/api/v1/payments/settings/upi",
        params: {
          provider: {
            enabled: true,
            upi_id: "saeloun@upi"
          }
        }
      )

      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
