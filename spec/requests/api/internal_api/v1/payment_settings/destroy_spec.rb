# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::PaymentSettings#destroy", type: :request, vcr: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:stripe_connected_account) { create(:stripe_connected_account, company:) }

  context "when user is an admin" do
    before do
      stripe_connected_account.update_columns(account_id: "acct_1NIU5SENZof8Gnl1")
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "is able to delete a stripe connection" do
      expect {
        send_request :delete, api_v1_payments_settings_stripe_disconnect_path, headers: auth_headers(user)
      }.to change(StripeConnectedAccount, :count).by(-1)
    end
  end

  context "when the user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :delete, api_v1_payments_settings_stripe_disconnect_path, headers: auth_headers(user)
    end

    it "is not be permitted to connect stripe" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when the user is an book_keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, payments_settings_path
      send_request :delete, api_v1_payments_settings_stripe_disconnect_path, headers: auth_headers(user)
    end

    it "is not be permitted to connect stripe" do
      expect(response).to have_http_status(:forbidden)
    end
  end
end
