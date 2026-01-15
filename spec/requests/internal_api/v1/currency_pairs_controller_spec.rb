# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::CurrencyPairsController", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  describe "GET #rate" do
    context "when both from and to parameters are present" do
      before do
        create(:currency_pair, from_currency: "USD", to_currency: "EUR", rate: 0.85)
      end

      it "returns the exchange rate" do
        send_request :get, rate_internal_api_v1_currency_pairs_path, params: { from: "USD", to: "EUR" },
          headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["rate"]).to eq("0.85")
      end

      it "normalizes currency codes to uppercase" do
        send_request :get, rate_internal_api_v1_currency_pairs_path, params: { from: "usd", to: "eur" },
          headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["rate"]).to eq("0.85")
      end

      it "strips whitespace from currency codes" do
        send_request :get, rate_internal_api_v1_currency_pairs_path, params: { from: " USD ", to: " EUR " },
          headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["rate"]).to eq("0.85")
      end
    end

    context "when currency pair does not exist" do
      it "returns not found error" do
        send_request :get, rate_internal_api_v1_currency_pairs_path, params: { from: "USD", to: "JPY" },
          headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response["error"]).to eq("Exchange rate not found for USD to JPY")
      end
    end

    context "when from parameter is missing" do
      it "returns bad request error" do
        send_request :get, rate_internal_api_v1_currency_pairs_path, params: { to: "EUR" }, headers: auth_headers(user)

        expect(response).to have_http_status(:bad_request)
        expect(json_response["error"]).to eq("Missing from/to currency")
      end
    end

    context "when to parameter is missing" do
      it "returns bad request error" do
        send_request :get, rate_internal_api_v1_currency_pairs_path, params: { from: "USD" },
          headers: auth_headers(user)

        expect(response).to have_http_status(:bad_request)
        expect(json_response["error"]).to eq("Missing from/to currency")
      end
    end

    context "when both parameters are missing" do
      it "returns bad request error" do
        send_request :get, rate_internal_api_v1_currency_pairs_path, headers: auth_headers(user)

        expect(response).to have_http_status(:bad_request)
        expect(json_response["error"]).to eq("Missing from/to currency")
      end
    end

    context "when from parameter is blank" do
      it "returns bad request error" do
        send_request :get, rate_internal_api_v1_currency_pairs_path, params: { from: "", to: "EUR" },
          headers: auth_headers(user)

        expect(response).to have_http_status(:bad_request)
        expect(json_response["error"]).to eq("Missing from/to currency")
      end
    end

    context "when to parameter is blank" do
      it "returns bad request error" do
        send_request :get, rate_internal_api_v1_currency_pairs_path, params: { from: "USD", to: "" },
          headers: auth_headers(user)

        expect(response).to have_http_status(:bad_request)
        expect(json_response["error"]).to eq("Missing from/to currency")
      end
    end

    context "when parameters are whitespace only" do
      it "returns bad request error for whitespace from parameter" do
        send_request :get, rate_internal_api_v1_currency_pairs_path, params: { from: "   ", to: "EUR" },
          headers: auth_headers(user)

        expect(response).to have_http_status(:bad_request)
        expect(json_response["error"]).to eq("Missing from/to currency")
      end

      it "returns bad request error for whitespace to parameter" do
        send_request :get, rate_internal_api_v1_currency_pairs_path, params: { from: "USD", to: "   " },
          headers: auth_headers(user)

        expect(response).to have_http_status(:bad_request)
        expect(json_response["error"]).to eq("Missing from/to currency")
      end
    end
  end
end
