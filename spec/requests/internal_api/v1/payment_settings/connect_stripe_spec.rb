# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::PaymentSettings#connect_stripe", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:stripe_connected_account) { build(:stripe_connected_account) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "creates stripe connected account" do
      allow(Stripe::Account).to receive(:create)
        .and_return(OpenStruct.new({ id: stripe_connected_account.account_id }))
      allow(Stripe::Account).to receive(:retrieve)
        .and_return(OpenStruct.new({ details_submitted: false }))
      allow(Stripe::AccountLink).to receive(:create)
        .and_return(OpenStruct.new({ url: "https://connect.stripe.com/setup/s/something" }))
      send_request :post, internal_api_v1_payments_settings_stripe_connect_path
      expect(response).to have_http_status(:ok)
      expect(json_response).to have_key("accountLink")
      expect(json_response["accountLink"]).to eq("https://connect.stripe.com/setup/s/something")
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "is not be permitted to connect stripe" do
      send_request :post, internal_api_v1_payments_settings_stripe_connect_path
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to view payment settings" do
      send_request :post, internal_api_v1_payments_settings_stripe_connect_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
