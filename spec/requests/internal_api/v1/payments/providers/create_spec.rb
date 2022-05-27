# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Payments::Providers#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "POST /internal_api/v1/payments/providers" do
      it "adds a payments provider" do
        provider = attributes_for(
          :payments_provider,
          name: "stripe",
        )
        send_request :post, internal_api_v1_payments_providers_path(provider:)
        expect(response).to have_http_status(:ok)
        expect(json_response["name"]).to eq("stripe")
      end

      context "when provider name is invalid" do
        describe "POST /internal_api/v1/payments/providers" do
          it "returns 422" do
            provider = attributes_for(
              :payments_provider,
              name: "foo",
            )
            send_request :post, internal_api_v1_payments_providers_path(provider:)
            expect(response).to have_http_status(:unprocessable_entity)
          end
        end
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    describe "POST /internal_api/v1/payments/providers" do
      it "returns forbidden" do
        send_request :post, internal_api_v1_payments_providers_path
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when unauthenticated" do
    describe "POST /internal_api/v1/payments/providers" do
      it "returns unauthorized" do
        send_request :post, internal_api_v1_payments_providers_path
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
      end
    end
  end
end
