# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Payments::Providers#index", type: :request do
  let(:company) do
    create(:company, payments_providers: create_list(:payments_provider, 3))
  end

  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "GET /internal_api/v1/payments/providers" do
      it "returns providers" do
        send_request :get, api_v1_payments_providers_path, headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["paymentsProviders"].size).to eq(3)
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    describe "GET /internal_api/v1/payments/providers" do
      it "returns forbidden" do
        send_request :get, api_v1_payments_providers_path, headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is a book keeper" do
      before do
        create(:employment, company:, user:)
        user.add_role :book_keeper, company
        sign_in user
      end

      describe "GET /internal_api/v1/payments/providers" do
        it "returns forbidden" do
          send_request :get, api_v1_payments_providers_path, headers: auth_headers(user)
          expect(response).to have_http_status(:forbidden)
        end
      end
    end
  end

  context "when unauthenticated" do
    describe "GET /internal_api/v1/payments/providers" do
      it "returns unauthorized" do
        send_request :get, api_v1_payments_providers_path
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
      end
    end
  end
end
