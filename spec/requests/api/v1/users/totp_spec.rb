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
      post "/api/v1/users/totp/setup", params: { current_password: "welcome12" }

      expect(response).to have_http_status(:ok)
      expect(json_response["secret"]).to be_present
      expect(json_response["provisioning_uri"]).to include("otpauth://totp/")
      expect(user.reload.otp_secret).to be_present
      expect(json_response["qr_code"]).to start_with("data:image/png;base64,")
      expect(response.headers["Cache-Control"]).to include("no-store")
    end

    it "does not reset an enabled authenticator before a replacement is confirmed" do
      user.reset_totp_setup!
      user.update!(otp_required_for_login: true)
      secret = user.otp_secret
      post "/api/v1/users/totp/setup", params: { current_password: "welcome12" }
      expect(response).to have_http_status(:unprocessable_content)
      expect(user.reload.otp_secret).to eq(secret)
      expect(user).to be_totp_enabled
    end

    it "allows authenticator setup alongside a required passkey" do
      user.update!(passkey_required_for_login: true)
      post "/api/v1/users/totp/setup", params: { current_password: "welcome12" }
      expect(response).to have_http_status(:ok)
      expect(user.reload.passkey_required_for_login).to eq(true)
    end
  end

  describe "POST /api/v1/users/totp/confirm" do
    it "enables totp and returns recovery codes" do
      post "/api/v1/users/totp/setup", params: { current_password: "welcome12" }
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

      post "/api/v1/users/totp/recovery_codes", params: { current_password: "welcome12" }

      expect(response).to have_http_status(:ok)
      expect(json_response["recovery_codes"].length).to eq(User::RECOVERY_CODES_COUNT)
    end
  end

  describe "DELETE /api/v1/users/totp" do
    it "disables totp" do
      user.reset_totp_setup!
      user.update!(otp_required_for_login: true)
      user.generate_recovery_codes!

      delete "/api/v1/users/totp", params: { current_password: "welcome12" }

      expect(response).to have_http_status(:ok)
      expect(user.reload.totp_enabled?).to eq(false)
      expect(json_response["enabled"]).to eq(false)
    end
  end

  it "rejects cross-origin TOTP authentication" do
    post "/api/v1/users/totp/authenticate",
      params: { pending_token: "pending-token", code: "123456" },
      headers: { "Origin" => "https://attacker.example" }

    expect(response).to have_http_status(:forbidden)
    expect(json_response["error"]).to eq("Cross-origin authentication is not allowed")
  end

  it "rejects TOTP sign-in for a member of an SSO-enforced workspace" do
    create(:employment, company:, user:)
    user.add_role :employee, company
    user.reset_totp_setup!
    user.update!(otp_required_for_login: true)
    code = ROTP::TOTP.new(user.reload.otp_secret, issuer: User::TOTP_ISSUER).now
    sign_out user
    post api_v1_users_login_path, params: { user: { email: user.email, password: "welcome12" } }
    pending_token = json_response.fetch("pending_token")
    company.update!(sso_enforced: true)

    post "/api/v1/users/totp/authenticate", params: { pending_token:, code: }

    expect(response).to have_http_status(:forbidden)
    expect(json_response["error"]).to eq(SsoEnforcement::SSO_REQUIRED_MESSAGE)
  end

  it "requires the current password for TOTP security changes" do
    post "/api/v1/users/totp/setup", params: { current_password: "wrong" }

    expect(response).to have_http_status(:unprocessable_content)
    expect(json_response["error"]).to eq("Current password is invalid")
    expect(user.reload.otp_secret).to be_nil
  end
end
