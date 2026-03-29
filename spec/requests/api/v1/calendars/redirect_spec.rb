# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Calendars redirect", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace: company) }

  before do
    create(:employment, user:, company:)
    user.add_role(:admin, company)
  end

  describe "GET /api/v1/calendars/redirect" do
    context "when signed in" do
      before do
        sign_in user
        send_request :get, api_v1_redirect_path, xhr: true
      end

      it "returns the Google authorization url" do
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["url"]).to include("accounts.google.com")
      end
    end

    context "when unauthenticated" do
      before do
        send_request :get, api_v1_redirect_path, xhr: true
      end

      it "returns the api unauthorized payload" do
        expect(response).to have_http_status(:unauthorized)
        expect(response.parsed_body["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
      end
    end
  end
end
