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
      post api_v1_payments_settings_stripe_connect_path

      expect(response).to have_http_status(:success)

      json_response = JSON.parse(response.body)
      expect(json_response["message"]).to eq("Stripe Connect initiated")
      expect(json_response).to have_key("redirect_url")
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

        expect(response).to have_http_status(:unprocessable_entity)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq("Failed to disconnect Stripe account")
      end
    end
  end
end
