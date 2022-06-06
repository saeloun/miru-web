# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Payments::Providers#index", type: :request do
  let(:company) do
    create(:company, payments_providers: create_list(:payments_provider, 3))
  end

  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "GET /internal_api/v1/payments/providers" do
      it "returns providers" do
        send_request :get, internal_api_v1_payments_providers_path
        expect(response).to have_http_status(:ok)
        expect(json_response["paymentsProviders"].size).to eq(3)
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    describe "GET /internal_api/v1/payments/providers" do
      it "returns forbidden" do
        send_request :get, internal_api_v1_payments_providers_path
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when unauthenticated" do
    describe "GET /internal_api/v1/payments/providers" do
      it "returns unauthorized" do
        send_request :get, internal_api_v1_payments_providers_path
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
      end
    end
  end
end
