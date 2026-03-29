# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::CurrencyPairs#rate", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "returns the exchange rate for a valid currency pair" do
      create(:currency_pair, from_currency: "USD", to_currency: "EUR", rate: 0.93)
      send_request :get, rate_api_v1_currency_pairs_path,
        params: { from: "USD", to: "EUR" },
        headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_response["rate"]).to eq("0.93")
    end

    it "returns 404 when the currency pair does not exist" do
      send_request :get, rate_api_v1_currency_pairs_path,
        params: { from: "USD", to: "JPY" },
        headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
    end

    it "returns 400 when from or to param is missing" do
      send_request :get, rate_api_v1_currency_pairs_path,
        params: { from: "USD" },
        headers: auth_headers(user)
      expect(response).to have_http_status(:bad_request)
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      send_request :get, rate_api_v1_currency_pairs_path,
        params: { from: "USD", to: "EUR" }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
