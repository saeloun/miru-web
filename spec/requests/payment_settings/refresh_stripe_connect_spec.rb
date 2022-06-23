# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PaymentsSetting#refresh_stripe_connect", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:stripe_connected_account) { build(:stripe_connected_account, company:) }

  context "when user is an admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when stripe connected account doesn't exist" do
      it "returns 404" do
        allow(Stripe::AccountLink).to receive(:create)
          .and_return(OpenStruct.new({ url: "https://connect.stripe.com/setup/s/something" }))
        allow(Stripe::Account).to receive(:retrieve)
          .and_return(OpenStruct.new({ details_submitted: false }))
        send_request :get, payments_settings_stripe_connect_refresh_path
        expect(response).to have_http_status(:not_found)
      end
    end

    context "when stripe connected account exists" do
      it "is able to refresh stripe connect successfully" do
        allow(Stripe::Account).to receive(:create)
          .and_return(OpenStruct.new({ id: stripe_connected_account.account_id }))
        allow(Stripe::AccountLink).to receive(:create)
          .and_return(OpenStruct.new({ url: "https://connect.stripe.com/setup/s/something" }))
        allow(Stripe::Account).to receive(:retrieve)
          .and_return(OpenStruct.new({ details_submitted: false }))
        stripe_connected_account.save!
        send_request :get, payments_settings_stripe_connect_refresh_path
        expect(response).to have_http_status(:redirect)
        expect(response).to redirect_to("https://connect.stripe.com/setup/s/something")
      end
    end
  end

  context "when the user is an employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "is not authorized to refresh stripe connect" do
      send_request :get, payments_settings_stripe_connect_refresh_path
      expect(response).to have_http_status(:redirect)
      expect(flash["alert"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when the user is an book keeper" do
    before do
      create(:company_user, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    it "is not authorized to refresh stripe connect" do
      send_request :get, payments_settings_stripe_connect_refresh_path
      expect(response).to have_http_status(:redirect)
      expect(flash["alert"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when unauthenticated" do
    it "is not authorized to refresh stripe connect" do
      send_request :get, payments_settings_stripe_connect_refresh_path
      expect(response).to have_http_status(:redirect)
      expect(flash["alert"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
