# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users::Totp", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "welcome12") }

  before do
    host! "localhost"
    sign_in(user)
  end

  describe "GET /api/v1/users/totp" do
    it "returns the current user's totp state" do
      get "/api/v1/users/totp"

      expect(response).to have_http_status(:ok)
      expect(json_response["enabled"]).to eq(false)
      expect(json_response["recovery_codes_count"]).to eq(0)
    end
  end

  describe "POST /api/v1/users/totp/setup" do
    it "returns a secret and provisioning uri" do
      post "/api/v1/users/totp/setup"

      expect(response).to have_http_status(:ok)
      expect(json_response["secret"]).to be_present
      expect(json_response["provisioning_uri"]).to include("otpauth://totp/")
      expect(user.reload.otp_secret).to be_present
    end
  end

  describe "POST /api/v1/users/totp/confirm" do
    it "enables totp and returns recovery codes" do
      post "/api/v1/users/totp/setup"
      code = ROTP::TOTP.new(user.reload.otp_secret, issuer: User::TOTP_ISSUER).now

      post "/api/v1/users/totp/confirm", params: { code: }

      expect(response).to have_http_status(:ok)
      expect(user.reload.otp_required_for_login).to eq(true)
      expect(json_response["enabled"]).to eq(true)
      expect(json_response["recovery_codes"].length).to eq(User::RECOVERY_CODES_COUNT)
    end
  end

  describe "POST /api/v1/users/totp/recovery_codes" do
    it "regenerates recovery codes for an enabled account" do
      user.reset_totp_setup!
      code = ROTP::TOTP.new(user.reload.otp_secret, issuer: User::TOTP_ISSUER).now
      user.verify_totp_code!(code)
      user.update!(otp_required_for_login: true)
      user.generate_recovery_codes!

      post "/api/v1/users/totp/recovery_codes"

      expect(response).to have_http_status(:ok)
      expect(json_response["recovery_codes"].length).to eq(User::RECOVERY_CODES_COUNT)
    end
  end

  describe "DELETE /api/v1/users/totp" do
    it "disables totp" do
      user.reset_totp_setup!
      user.update!(otp_required_for_login: true)
      user.generate_recovery_codes!

      delete "/api/v1/users/totp"

      expect(response).to have_http_status(:ok)
      expect(user.reload.totp_enabled?).to eq(false)
      expect(json_response["enabled"]).to eq(false)
    end
  end
end
