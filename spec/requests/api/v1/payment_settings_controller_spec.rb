# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::PaymentSettingsController, type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, user:, company:)
    user.add_role :admin, company
    sign_in user
  end

  describe "GET #index" do
    context "when user is authenticated" do
      context "without stripe connected account" do
        it "returns payment settings with stripe not connected" do
          get api_v1_payments_settings_path

          expect(response).to have_http_status(:success)

          json_response = JSON.parse(response.body)
          expect(json_response["providers"]).to be_present
          expect(json_response["providers"]["stripe"]["connected"]).to be false
          expect(json_response["providers"]["paypal"]["connected"]).to be false
        end
      end

      context "with stripe connected account" do
        let!(:stripe_account) do
          create(:stripe_connected_account,
            company:,
            account_id: "acct_test123"
          )
        end

        it "returns payment settings with stripe connected" do
          # Stub any account retrieval to return details_submitted: true
          allow(Stripe::Account).to receive(:retrieve).and_return(
            OpenStruct.new(
              id: "acct_test123",
              details_submitted: true,
              charges_enabled: true,
              payouts_enabled: true
            )
          )

          get api_v1_payments_settings_path

          expect(response).to have_http_status(:success)

          json_response = JSON.parse(response.body)
          expect(json_response["providers"]).to be_present
          expect(json_response["providers"]["stripe"]["connected"]).to be true
        end
      end
    end

    context "when user is not authenticated" do
      before { sign_out user }

      it "returns unauthorized" do
        get api_v1_payments_settings_path
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST #connect_stripe" do
    it "returns stripe connect initiation message" do
      stub_stripe_account_retrieve("acct_test_new", details_submitted: false)
      stub_stripe_account_link_creation
      allow(Stripe::Account).to receive(:create).and_return(OpenStruct.new(id: "acct_test_new"))

      post api_v1_payments_settings_stripe_connect_path

      expect(response).to have_http_status(:success)

      json_response = JSON.parse(response.body)
      expect(json_response).to have_key("accountLink")
      expect(json_response["accountLink"]).to eq("https://connect.stripe.com/test_link")
    end
  end

  describe "DELETE #destroy" do
    context "when stripe account exists" do
      let!(:stripe_account) do
        create(:stripe_connected_account,
          company:,
          account_id: "acct_test123"
        )
      end

      it "disconnects the stripe account" do
        expect {
          delete api_v1_payments_settings_stripe_disconnect_path
        }.to change { StripeConnectedAccount.count }.by(-1)

        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response["message"]).to eq("Stripe account disconnected successfully")
      end
    end

    context "when stripe account does not exist" do
      it "returns an error" do
        delete api_v1_payments_settings_stripe_disconnect_path

        expect(response).to have_http_status(:unprocessable_content)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq("Failed to disconnect Stripe account")
      end
    end
  end

  describe "PATCH #update_paypal" do
    let(:connection_service) { instance_double(PaymentProviders::PaypalConnectionService, process: true, error: nil) }

    before do
      allow(PaymentProviders::PaypalConnectionService).to receive(:new).and_return(connection_service)
    end

    it "saves credentials through the connection service and returns the settings payload" do
      expect(PaymentProviders::PaypalConnectionService).to receive(:new) do |provider:, webhook_url:|
        expect(provider.client_id).to eq("client-id")
        expect(provider.client_secret).to eq("secret")
        expect(provider.paypal_environment).to eq("sandbox")
        expect(provider.enabled).to be(true)
        expect(provider.enabled_on_invoices?).to be(true)
        expect(provider.accepted_payment_methods).to eq(["paypal"])
        expect(webhook_url).to eq("http://www.example.com/webhooks/paypal/events")
        provider.connected = true
        provider.settings["webhook_id"] = "WH-1"
        provider.save!
        connection_service
      end

      patch api_v1_payments_settings_paypal_path, params: {
        provider: { enabled: true, enabled_on_invoices: true, client_id: "client-id", client_secret: "secret", environment: "sandbox" }
      }

      expect(response).to have_http_status(:success)
      paypal = JSON.parse(response.body)["providers"]["paypal"]
      expect(paypal).to include("connected" => true, "enabled" => true, "enabledOnInvoices" => true, "clientId" => "client-id", "clientSecretConfigured" => true, "environment" => "sandbox", "webhookId" => "WH-1")
      expect(paypal["webhookUrl"]).to eq("http://www.example.com/webhooks/paypal/events")
      expect(paypal).not_to have_key("clientSecret")
    end

    it "keeps the stored secret when a blank secret is sent" do
      provider = company.payments_providers.create!(name: PaymentsProvider::PAYPAL_PROVIDER, settings: { client_id: "client-id" })
      provider.client_secret = "old-secret"
      provider.save!

      patch api_v1_payments_settings_paypal_path, params: { provider: { client_id: "client-id", client_secret: "", environment: "live" } }

      expect(response).to have_http_status(:success)
      expect(provider.reload.client_secret).to eq("old-secret")
    end

    it "keeps PayPal enabled when the enabled field is omitted" do
      provider = create(
        :payments_provider,
        company:,
        name: PaymentsProvider::PAYPAL_PROVIDER,
        connected: true,
        enabled: true,
        settings: { client_id: "old-client-id", environment: "sandbox", webhook_id: "WH-1" }
      )

      patch api_v1_payments_settings_paypal_path, params: {
        provider: { client_id: "client-id", client_secret: "secret", environment: "sandbox" }
      }

      expect(response).to have_http_status(:success)
      expect(provider.reload).to be_enabled
    end

    it "returns 422 with the PayPal error when the connection fails" do
      allow(connection_service).to receive_messages(process: false, error: "Client Authentication failed")

      patch api_v1_payments_settings_paypal_path, params: { provider: { client_id: "client-id", client_secret: "bad", environment: "sandbox", enabled: true } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)["errors"]).to eq("Client Authentication failed")
    end

    it "rejects session-authenticated credential changes without a CSRF token" do
      original = described_class.allow_forgery_protection
      described_class.allow_forgery_protection = true
      begin
        patch api_v1_payments_settings_paypal_path,
          params: { provider: { client_id: "attacker", client_secret: "secret", environment: "live" } }
      ensure
        described_class.allow_forgery_protection = original
      end

      expect(response).to have_http_status(:unprocessable_content)
      expect(PaymentProviders::PaypalConnectionService).not_to have_received(:new)
    end

    it "does not let an invalid bearer header bypass CSRF for a browser session" do
      original = described_class.allow_forgery_protection
      described_class.allow_forgery_protection = true
      begin
        patch api_v1_payments_settings_paypal_path,
          params: { provider: { client_id: "attacker", client_secret: "secret", environment: "live" } },
          headers: { "Authorization" => "Bearer invalid" }
      ensure
        described_class.allow_forgery_protection = original
      end

      expect(response).to have_http_status(:unprocessable_content)
      expect(PaymentProviders::PaypalConnectionService).not_to have_received(:new)
    end

    it "allows a valid stateless token without a browser CSRF token" do
      sign_out user
      _, cli_token = CliSession.issue_for(user:, company:)
      original = described_class.allow_forgery_protection
      described_class.allow_forgery_protection = true
      begin
        patch api_v1_payments_settings_paypal_path,
          params: { provider: { client_id: "client-id", client_secret: "secret", environment: "sandbox" } },
          headers: cli_auth_headers(cli_token)
      ensure
        described_class.allow_forgery_protection = original
      end

      expect(response).to have_http_status(:success)
    end

    it "is forbidden for employees" do
      user.remove_role :admin, company
      user.add_role :employee, company

      patch api_v1_payments_settings_paypal_path, params: { provider: { client_id: "x" } }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE #disconnect_paypal" do
    it "disconnects through the connection service" do
      company.payments_providers.create!(name: PaymentsProvider::PAYPAL_PROVIDER, settings: { client_id: "client-id" })
      service = instance_double(PaymentProviders::PaypalConnectionService)
      allow(PaymentProviders::PaypalConnectionService).to receive(:new).and_return(service)
      expect(service).to receive(:disconnect!) { company.payments_providers.find_by(name: "paypal").destroy! }

      delete api_v1_payments_settings_paypal_path

      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)["providers"]["paypal"]["connected"]).to be(false)
    end

    it "returns 404 when PayPal was never configured" do
      delete api_v1_payments_settings_paypal_path

      expect(response).to have_http_status(:not_found)
    end

    it "rejects session-authenticated disconnects without a CSRF token" do
      company.payments_providers.create!(name: PaymentsProvider::PAYPAL_PROVIDER, settings: { client_id: "client-id" })

      original = described_class.allow_forgery_protection
      described_class.allow_forgery_protection = true
      begin
        delete api_v1_payments_settings_paypal_path
      ensure
        described_class.allow_forgery_protection = original
      end

      expect(response).to have_http_status(:unprocessable_content)
      expect(company.payments_providers.find_by(name: PaymentsProvider::PAYPAL_PROVIDER)).to be_present
    end
  end
end
