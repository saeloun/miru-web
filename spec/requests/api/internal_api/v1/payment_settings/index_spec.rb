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
      expect(json_response["providers"]).to have_key("paypal")
      expect(json_response["providers"]["stripe"]).to have_key("connected")
      expect(json_response["providers"]["paypal"]).to have_key("connected")
      expect(json_response["providers"]["stripe"]["connected"]).to be(false)
      expect(json_response["providers"]["paypal"]["connected"]).to be(false)
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
  end
end
