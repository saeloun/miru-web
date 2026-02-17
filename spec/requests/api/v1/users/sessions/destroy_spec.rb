# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users::Sessions#destroy", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "welcome") }

  context "when logged in with valid email and password" do
    before do
      sign_in user
    end

    it "logout the user successfully" do
      send_request :delete, api_v1_users_logout_path
      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(I18n.t("devise.sessions.signed_out"))
    end
  end
end
