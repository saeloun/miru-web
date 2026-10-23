# frozen_string_literal: true

require "rails_helper"
require "webauthn/fake_client"

RSpec.describe "Second-factor sign in", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "welcome12") }
  let(:fake_client) { WebAuthn::FakeClient.new("http://localhost") }

  before do
    host! "localhost"
    create(:employment, company:, user:)
    user.add_role :employee, company
    user.reset_totp_setup!
    user.update!(otp_required_for_login: true)
  end

  def login(password: "welcome12", **options)
    post api_v1_users_login_path(**options), params: { user: { email: user.email, password: } }
    json_response
  end

  def verify_totp(pending_token, **options)
    post "/api/v1/users/totp/authenticate", params: {
      pending_token:,
      code: ROTP::TOTP.new(user.reload.otp_secret).now,
      **options
    }
  end

  def trust_browser
    verify_totp(login.fetch("pending_token"), trust_browser: true)
    expect(response).to have_http_status(:ok)
    delete api_v1_users_logout_path
  end

  it "requires the second factor before granting access to the app" do
    expect(login["requires_totp"]).to eq(true)
    get api_v1_users_me_path
    expect(response).to have_http_status(:unauthorized)
  end

  it "trusts this browser for 30 days without extending trust on password-only logins" do
    trust_browser
    travel 29.days
    expect(login["user"]).to be_present
    delete api_v1_users_logout_path
    travel 2.days
    expect(login["requires_totp"]).to eq(true)
  end

  it "does not trust a browser without an explicit choice" do
    verify_totp(login.fetch("pending_token"))
    expect(response).to have_http_status(:ok)
    delete api_v1_users_logout_path
    expect(login["requires_totp"]).to eq(true)
  end

  it "protects trusted-browser cookies with HTTPS, HttpOnly, and SameSite" do
    https!
    verify_totp(login.fetch("pending_token"), trust_browser: true)
    expect(response).to have_http_status(:ok)
    cookie = Array(response.headers["Set-Cookie"]).find { |value| value.start_with?("miru_trusted_browser=") }
    expect(cookie).to include("secure", "httponly", "samesite=lax", "expires=")
  end

  it "keeps browser trust when the browser updates its user agent" do
    trust_browser
    post api_v1_users_login_path, params: { user: { email: user.email, password: "welcome12" } },
      headers: { "User-Agent" => "Updated browser version" }
    expect(json_response["user"]).to be_present
  end

  it "only permits each recovery code once" do
    recovery_code = user.generate_recovery_codes!.first
    post "/api/v1/users/totp/authenticate", params: { pending_token: login.fetch("pending_token"), recovery_code: }
    expect(response).to have_http_status(:ok)
    delete api_v1_users_logout_path
    post "/api/v1/users/totp/authenticate", params: { pending_token: login.fetch("pending_token"), recovery_code: }
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "still rejects an incorrect password on a trusted browser" do
    trust_browser
    login(password: "incorrect")
    expect(response).to have_http_status(:unprocessable_content)
    expect(json_response).not_to have_key("user")
  end

  it "revokes trust after password changes" do
    trust_browser
    user.update!(password: "newpassword12", password_confirmation: "newpassword12")
    expect(login(password: "newpassword12")["requires_totp"]).to eq(true)
  end

  it "rejects a tampered trusted-browser cookie" do
    trust_browser
    cookies[:miru_trusted_browser] = "tampered"
    expect(login["requires_totp"]).to eq(true)
  end

  it "does not allow native clients to bypass their second factor using browser trust" do
    trust_browser
    login(app: "miru-mobile")
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "rejects a challenge after the password changes" do
    pending_token = login.fetch("pending_token")
    user.update!(password: "newpassword12", password_confirmation: "newpassword12")
    verify_totp(pending_token)
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "rejects reuse of a completed challenge even with a new authenticator code" do
    pending_token = login.fetch("pending_token")
    verify_totp(pending_token)
    expect(response).to have_http_status(:ok)
    delete api_v1_users_logout_path
    travel 31.seconds
    verify_totp(pending_token)
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "rejects a challenge copied to another browser" do
    pending_token = login.fetch("pending_token")
    cookies.delete("_miru_web_session")
    verify_totp(pending_token)
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "expires incomplete challenges after ten minutes" do
    pending_token = login.fetch("pending_token")
    travel 11.minutes
    verify_totp(pending_token)
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "rejects a challenge when the account is locked after the password step" do
    pending_token = login.fetch("pending_token")
    user.lock_access!
    verify_totp(pending_token)
    expect(response).to have_http_status(:unauthorized)
  end

  it "locks the account after repeated incorrect second-factor codes" do
    pending_token = login.fetch("pending_token")
    Devise.maximum_attempts.times do
      post "/api/v1/users/totp/authenticate", params: { pending_token:, code: "incorrect" }
    end
    expect(user.reload).to be_access_locked
    verify_totp(pending_token)
    expect(response).to have_http_status(:unauthorized)
  end

  it "does not grant trust for an invalid second factor" do
    post "/api/v1/users/totp/authenticate", params: {
      pending_token: login.fetch("pending_token"), code: "not-a-code", trust_browser: true
    }
    expect(response).to have_http_status(:unprocessable_content)
    expect(cookies[:miru_trusted_browser]).to be_nil
    expect(login["requires_totp"]).to eq(true)
  end

  it "revokes browser trust when recovery codes are regenerated" do
    trust_browser
    user.generate_recovery_codes!
    expect(login["requires_totp"]).to eq(true)
  end

  it "binds browser trust to the verified account" do
    trust_browser
    other_user = create(:user, email: "other@example.com", password: "welcome12", current_workspace_id: company.id)
    create(:employment, user: other_user, company:)
    other_user.reset_totp_setup!
    other_user.update!(otp_required_for_login: true)
    post api_v1_users_login_path, params: { user: { email: other_user.email, password: "welcome12" } }
    expect(json_response["requires_totp"]).to eq(true)
  end

  it "requires the configured second factor after a phone OTP" do
    user.update!(phone: "+919876543210")
    post "/api/v1/users/otp/request", params: { phone: user.phone }
    post "/api/v1/users/otp/verify", params: { pending_token: json_response.fetch("pending_token"), code: "123456" }
    expect(json_response["requires_totp"]).to eq(true)
    expect(json_response).not_to have_key("user")
    get api_v1_users_me_path
    expect(response).to have_http_status(:unauthorized)
  end

  it "prevents native phone OTP from bypassing the configured second factor" do
    user.update!(phone: "+919876543210")
    post "/api/v1/mobile/otp/request", params: { phone: user.phone }
    post "/api/v1/mobile/otp/verify", params: { pending_token: json_response.fetch("pending_token"), code: "123456" }
    expect(response).to have_http_status(:unprocessable_content)
    expect(json_response.dig("user", "token")).to be_nil
  end

  [:google_oauth2, :github].each do |provider|
    it "requires the configured second factor after #{provider} sign in, including enforced SSO" do
      company.update!(sso_enforced: true)
      factory = provider == :github ? :github_user_data : :google_user_data
      oauth_data = build(factory)
      oauth_data.info.email = user.email
      oauth_data.extra.all_emails.first["email"] = user.email if provider == :github
      OmniAuth.config.mock_auth[provider] = oauth_data

      post "/users/auth/#{provider}/callback"
      expect(response).to redirect_to("/login?verify=1")
      get api_v1_users_me_path
      expect(response).to have_http_status(:unauthorized)
      get "/api/v1/users/second_factor"
      expect(json_response["requires_totp"]).to eq(true)
      verify_totp(json_response.fetch("pending_token"))
      expect(response).to have_http_status(:ok)
      expect(json_response.dig("user", "id")).to eq(user.id)
    end
  end

  it "lets a user revoke all trusted browsers after confirming their password" do
    trust_browser
    login
    post "/api/v1/users/totp/revoke_trusted_browsers", params: { current_password: "wrong" }
    expect(response).to have_http_status(:unprocessable_content)
    post "/api/v1/users/totp/revoke_trusted_browsers", params: { current_password: "welcome12" }
    expect(response).to have_http_status(:ok)
    delete api_v1_users_logout_path
    expect(login["requires_totp"]).to eq(true)
  end

  context "with both authenticator codes and passkeys" do
    before do
      user.ensure_webauthn_id!
      relying_party = WebAuthn::RelyingParty.new(allowed_origins: ["http://localhost"], id: "localhost", name: "Miru")
      options = relying_party.options_for_registration(user: { id: user.webauthn_id, name: user.email })
      credential = relying_party.verify_registration(
        fake_client.create(challenge: options.challenge, rp_id: "localhost"), options.challenge
      )
      user.passkeys.create!(external_id: credential.id, public_key: credential.public_key, sign_count: credential.sign_count)
      user.update!(passkey_required_for_login: true)
    end

    it "offers either factor and accepts an authenticator code as fallback" do
      challenge = login
      expect(challenge.values_at("requires_passkey", "requires_totp")).to eq([true, true])
      verify_totp(challenge.fetch("pending_token"))
      expect(response).to have_http_status(:ok)
    end

    it "accepts a passkey and remembers the verified browser" do
      challenge = login
      assertion = fake_client.get(challenge: challenge.dig("public_key", "challenge"), rp_id: "localhost", user_verified: true,
        allow_credentials: [user.passkeys.first.external_id])
      post "/api/v1/users/passkeys/authenticate", params: {
        pending_token: challenge.fetch("pending_token"), credential: assertion, trust_browser: true
      }
      expect(response).to have_http_status(:ok)
      delete api_v1_users_logout_path
      expect(login["user"]).to be_present
    end

    it "rejects a passkey assertion without device user verification" do
      challenge = login
      assertion = fake_client.get(challenge: challenge.dig("public_key", "challenge"), rp_id: "localhost",
        allow_credentials: [user.passkeys.first.external_id], user_verified: false)
      post "/api/v1/users/passkeys/authenticate", params: {
        pending_token: challenge.fetch("pending_token"), credential: assertion, trust_browser: true
      }
      expect(response).to have_http_status(:unprocessable_content)
      expect(cookies[:miru_trusted_browser]).to be_nil
    end
  end
end
