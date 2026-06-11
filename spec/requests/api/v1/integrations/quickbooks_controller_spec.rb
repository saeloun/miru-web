# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Integrations::QuickbooksController", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user

    allow(QuickBooks::Configuration).to receive(:configured?).and_return(true)
    allow(QuickBooks::Configuration).to receive(:environment).and_return("sandbox")
  end

  describe "GET /api/v1/integrations/quickbooks/status" do
    it "returns disconnected status when QuickBooks has not been connected" do
      get "/api/v1/integrations/quickbooks/status", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["quickbooks"]).to include(
        "configured" => true,
        "connected" => false,
        "environment" => "sandbox",
        "reconnectRequired" => false
      )
    end

    it "returns active connection metadata" do
      create(:quickbooks_connection, company:, realm_id: "1234567890")

      get "/api/v1/integrations/quickbooks/status", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("quickbooks", "connected")).to be(true)
      expect(json_response.dig("quickbooks", "realmId")).to eq("1234567890")
      expect(json_response.dig("quickbooks", "companyName")).to eq("QuickBooks Sandbox Company")
      expect(json_response.dig("quickbooks", "mappingSettings", "incomeAccountId")).to eq("79")
    end
  end

  describe "POST /api/v1/integrations/quickbooks/connect" do
    it "returns an Intuit authorization URL" do
      oauth_client = instance_double(QuickBooks::OauthClient)
      allow(QuickBooks::OauthClient).to receive(:new).and_return(oauth_client)
      allow(oauth_client).to receive(:authorization_uri).and_return("https://appcenter.intuit.com/connect/oauth2")

      post "/api/v1/integrations/quickbooks/connect", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["authorizationUrl"]).to eq("https://appcenter.intuit.com/connect/oauth2")
    end

    it "returns an error when credentials are missing" do
      allow(QuickBooks::Configuration).to receive(:configured?).and_return(false)

      post "/api/v1/integrations/quickbooks/connect", headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq("QuickBooks OAuth credentials are not configured")
    end
  end

  describe "GET /api/v1/integrations/quickbooks/callback" do
    it "stores encrypted tokens and connected realm metadata" do
      oauth_state = nil
      oauth_client = instance_double(QuickBooks::OauthClient)
      quickbooks_client = instance_double(QuickBooks::Client)

      allow(QuickBooks::OauthClient).to receive(:new).and_return(oauth_client)
      allow(oauth_client).to receive(:authorization_uri) do |state:|
        oauth_state = state
        "https://appcenter.intuit.com/connect/oauth2?state=#{state}"
      end
      allow(oauth_client).to receive(:exchange_code!).and_return(
        "access_token" => "access-token",
        "refresh_token" => "refresh-token",
        "expires_in" => 3600,
        "x_refresh_token_expires_in" => 8_640_000
      )
      allow(QuickBooks::Client).to receive(:new).and_return(quickbooks_client)
      allow(quickbooks_client).to receive(:company_info).and_return(
        "CompanyInfo" => { "CompanyName" => "Saeloun Books" }
      )

      post "/api/v1/integrations/quickbooks/connect", headers: auth_headers(user)
      get(
        "/api/v1/integrations/quickbooks/callback",
        params: { code: "auth-code", realmId: "987654321", state: oauth_state },
        headers: auth_headers(user)
      )

      expect(response).to redirect_to("/settings/payment?quickbooks=connected")
      connection = company.quickbooks_connections.last
      expect(connection.realm_id).to eq("987654321")
      expect(connection).to be_connected
      expect(connection.access_token).to eq("access-token")
      expect(connection.refresh_token).to eq("refresh-token")
      expect(connection.access_token_ciphertext).not_to include("access-token")
      expect(connection.company_name).to eq("Saeloun Books")
    end

    it "rejects callbacks with an invalid oauth state" do
      oauth_client = instance_double(QuickBooks::OauthClient)
      allow(QuickBooks::OauthClient).to receive(:new).and_return(oauth_client)
      allow(oauth_client).to receive(:authorization_uri).and_return("https://appcenter.intuit.com/connect/oauth2")
      allow(oauth_client).to receive(:exchange_code!)

      post "/api/v1/integrations/quickbooks/connect", headers: auth_headers(user)
      get(
        "/api/v1/integrations/quickbooks/callback",
        params: { code: "auth-code", realmId: "987654321", state: "wrong-state" },
        headers: auth_headers(user)
      )

      expect(response).to redirect_to("/settings/payment?quickbooks=error")
      expect(oauth_client).not_to have_received(:exchange_code!)
      expect(company.quickbooks_connections).to be_empty
    end

    it "redirects to settings with a sanitized log when token exchange fails" do
      oauth_state = nil
      oauth_client = instance_double(QuickBooks::OauthClient)

      allow(QuickBooks::OauthClient).to receive(:new).and_return(oauth_client)
      allow(oauth_client).to receive(:authorization_uri) do |state:|
        oauth_state = state
        "https://appcenter.intuit.com/connect/oauth2?state=#{state}"
      end
      allow(oauth_client).to receive(:exchange_code!).and_raise(
        QuickBooks::Error,
        "token secret should not be logged"
      )
      allow(Rails.logger).to receive(:warn)

      post "/api/v1/integrations/quickbooks/connect", headers: auth_headers(user)
      get(
        "/api/v1/integrations/quickbooks/callback",
        params: { code: "auth-code", realmId: "987654321", state: oauth_state },
        headers: auth_headers(user)
      )

      expect(response).to redirect_to("/settings/payment?quickbooks=error")
      expect(Rails.logger).to have_received(:warn).with("QuickBooks OAuth callback failed: QuickBooks::Error")
      expect(company.quickbooks_connections).to be_empty
    end
  end

  describe "PATCH /api/v1/integrations/quickbooks/settings" do
    it "updates mapping settings" do
      create(:quickbooks_connection, company:)

      patch(
        "/api/v1/integrations/quickbooks/settings",
        params: {
          quickbooks: {
            income_account_id: "42",
            deposit_account_id: "99",
            service_item_id: "7"
          }
        },
        headers: auth_headers(user)
      )

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("quickbooks", "mappingSettings", "incomeAccountId")).to eq("42")
      expect(json_response.dig("quickbooks", "mappingSettings", "depositAccountId")).to eq("99")
      expect(json_response.dig("quickbooks", "mappingSettings", "serviceItemId")).to eq("7")
    end

    it "clears submitted blank mapping settings" do
      connection = create(
        :quickbooks_connection,
        company:,
        settings: {
          "income_account_id" => "42",
          "deposit_account_id" => "99",
          "service_item_id" => "7"
        }
      )

      patch(
        "/api/v1/integrations/quickbooks/settings",
        params: {
          quickbooks: {
            deposit_account_id: "",
            service_item_id: ""
          }
        },
        headers: auth_headers(user)
      )

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("quickbooks", "mappingSettings", "incomeAccountId")).to eq("42")
      expect(json_response.dig("quickbooks", "mappingSettings", "depositAccountId")).to be_nil
      expect(json_response.dig("quickbooks", "mappingSettings", "serviceItemId")).to be_nil
      expect(connection.reload.deposit_account_id).to be_nil
      expect(connection.service_item_id).to be_nil
    end

    it "returns an error when QuickBooks is not connected" do
      patch(
        "/api/v1/integrations/quickbooks/settings",
        params: { quickbooks: { service_item_id: "7" } },
        headers: auth_headers(user)
      )

      expect(response).to have_http_status(:not_found)
      expect(json_response["errors"]).to eq("Connect QuickBooks before saving settings")
    end
  end

  describe "POST /api/v1/integrations/quickbooks/sync" do
    it "queues outbound client, invoice, and payment exports" do
      connection = create(:quickbooks_connection, company:)
      invoice = create(:invoice, company:)
      payment = create(:payment, invoice:)
      create(:payment, invoice:).update_column(:discarded_at, Time.current)

      expect {
        post "/api/v1/integrations/quickbooks/sync", headers: auth_headers(user)
      }.to have_enqueued_job(QuickBooks::ExportCustomerJob).with(connection.id, invoice.client.id, "manual")
        .and have_enqueued_job(QuickBooks::ExportInvoiceJob).with(connection.id, invoice.id, "manual")
        .and have_enqueued_job(QuickBooks::ExportPaymentJob).with(connection.id, payment.id, "manual")

      expect(response).to have_http_status(:accepted)
      expect(json_response.dig("quickbooks", "sync")).to include(
        "status" => "queued",
        "clientsQueued" => 1,
        "invoicesQueued" => 1,
        "paymentsQueued" => 1
      )
    end

    it "returns an error when QuickBooks is not connected" do
      post "/api/v1/integrations/quickbooks/sync", headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
      expect(json_response["errors"]).to eq("Connect QuickBooks before syncing records")
    end

    it "does not allow employees to queue a workspace sync" do
      create(:quickbooks_connection, company:)
      user.remove_role :admin, company
      user.add_role :employee, company

      post "/api/v1/integrations/quickbooks/sync", headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/integrations/quickbooks/disconnect" do
    it "disconnects the active connection" do
      connection = create(:quickbooks_connection, company:)

      delete "/api/v1/integrations/quickbooks/disconnect", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("quickbooks", "connected")).to be(false)
      expect(connection.reload).to be_disconnected
      expect(connection.access_token).to be_nil
    end
  end

  context "when user is an employee" do
    before do
      user.remove_role :admin, company
      user.add_role :employee, company
    end

    it "does not allow QuickBooks status access" do
      get "/api/v1/integrations/quickbooks/status", headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end
  end
end
