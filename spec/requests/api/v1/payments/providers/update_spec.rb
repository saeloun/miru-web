# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Payments::Providers#update", type: :request do
  let(:company) { create(:company) }
  let(:payments_provider) { create(:payments_provider, company:) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "PATCH /internal_api/v1/payments/providers/:id" do
      it "updates a payments provider" do
        send_request :patch, api_v1_payments_provider_path(
          id: payments_provider.id,
          params: {
            provider: {
              enabled: true
            }
          }
        ), headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["enabled"]).to eq(true)
      end

      context "when provider name is invalid" do
        describe "PATCH /internal_api/v1/payments/providers/:id" do
          it "returns 422" do
            send_request :patch, api_v1_payments_provider_path(
              id: payments_provider.id,
              params: {
                provider: {
                  name: "foo"
                }
              }
            ), headers: auth_headers(user)
            expect(response).to have_http_status(:unprocessable_content)
          end
        end
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    describe "PATCH /internal_api/v1/payments/providers/:id" do
      it "returns forbidden" do
        send_request :patch, api_v1_payments_provider_path(
          id: payments_provider.id,
          params: {
            provider: {
              enabled: true
            }
          }
        ), headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is a book keeper" do
      before do
        create(:employment, company:, user:)
        user.add_role :book_keeper, company
        sign_in user
      end

      describe "PATCH /internal_api/v1/payments/providers/:id" do
        it "returns forbidden" do
          send_request :patch, api_v1_payments_provider_path(
            id: payments_provider.id,
            params: {
              provider: {
                enabled: true
              }
            }
          ), headers: auth_headers(user)
          expect(response).to have_http_status(:forbidden)
        end
      end
    end
  end

  context "when unauthenticated" do
    describe "PATCH /internal_api/v1/payments/providers/:id" do
      it "returns unauthorized" do
        send_request :patch, api_v1_payments_provider_path(
          id: payments_provider.id,
          params: {
            provider: {
              enabled: true
            }
          }
        )
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
      end
    end
  end
end
