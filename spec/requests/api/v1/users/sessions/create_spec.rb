# frozen_string_literal: true

require "rails_helper"
require "webauthn/fake_client"

RSpec.describe "Api::V1::Users::Sessions#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "welcome12") }
  let(:fake_client) { ::WebAuthn::FakeClient.new("http://localhost") }
  let(:relying_party) do
    ::WebAuthn::RelyingParty.new(
      allowed_origins: ["http://localhost"],
      id: "localhost",
      name: "Miru"
    )
  end

  before do
    host! "localhost"
  end

  context "when logged in with valid email and password" do
    it "logs the user successfully" do
      send_request :post, api_v1_users_login_path, params: {
        user: {
          email: user.email,
          password: user.password
        }
      }
      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(I18n.t("devise.sessions.signed_in"))
    end

    it "persists the requested locale on sign in" do
      send_request :post, api_v1_users_login_path, params: {
        user: {
          email: user.email,
          password: user.password,
          locale: "hi"
        }
      }

      expect(response).to have_http_status(:ok)
      expect(user.reload.locale).to eq("hi")
      expect(json_response.dig("user", "locale")).to eq("hi")
    end
  end

  context "when logged in on miru desktop app with valid email and password" do
    it "logs the user successfully" do
      send_request :post, api_v1_users_login_path(app: "miru-desktop"), params: {
        user: {
          email: user.email,
          password: user.password
        }
      }
      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(I18n.t("devise.sessions.signed_in"))
      expect(json_response).to have_key("user")
      expect(json_response).to have_key("avatar_url")
      expect(json_response).to have_key("company_role")
      expect(json_response).to have_key("confirmed_user")
      expect(json_response).to have_key("company")
      expect(json_response).to have_key("google_oauth_success")
    end
  end

  context "when logged in on miru mobile app with valid email and password" do
    it "logs the user successfully" do
      send_request :post, api_v1_users_login_path(app: "miru-mobile"), params: {
        user: {
          email: user.email,
          password: user.password
        }
      }
      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(I18n.t("devise.sessions.signed_in"))
      expect(json_response.dig("user", "token")).to be_present
      expect(json_response["user"]).to have_key("avatar_url")
      expect(json_response.dig("user", "confirmed")).to eq(true)
      expect(json_response).to have_key("company_role")
      expect(json_response).to have_key("company")
    end
  end

  context "when logged in with wrong combination of email and password" do
    it "not able to log in" do
      send_request :post, api_v1_users_login_path, params: {
        user: {
          email: user.email,
          password: user.password + "abc"
        }
      }
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq(I18n.t("sessions.failure.invalid"))
    end
  end

  context "when too many invalid password attempts happen" do
    before do
      10.times do
        post api_v1_users_login_path, params: {
          user: {
            email: user.email,
            password: "wrong-password"
          }
        }
      end
    end

    it "locks the account" do
      expect(user.reload.access_locked?).to eq(true)
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq(I18n.t("sessions.failure.invalid"))
    end

    it "resets failed attempts after a successful sign in once unlocked" do
      user.update!(locked_at: 31.minutes.ago)

      post api_v1_users_login_path, params: {
        user: {
          email: user.email,
          password: user.password
        }
      }

      expect(response).to have_http_status(:ok)
      expect(user.reload.failed_attempts).to eq(0)
    end
  end

  context "when logged in on miru desktop app with wrong combination of email and password" do
    it "not able to log in" do
      send_request :post, api_v1_users_login_path(app: "miru-desktop"), params: {
        user: {
          email: user.email,
          password: user.password + "abc"
        }
      }
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq(I18n.t("sessions.failure.invalid"))
    end
  end

  context "when logged in with invalid email of a user who does not exist" do
    it "not able to log in" do
      send_request :post, api_v1_users_login_path, params: {
        user: {
          email: "miru@example.com",
          password: user.password
        }
      }
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq(I18n.t("sessions.failure.invalid"))
    end
  end

  context "when logged in on miru desktop app with invalid email of a user who does not exist" do
    it "not able to log in" do
      send_request :post, api_v1_users_login_path(app: "miru-desktop"), params: {
        user: {
          email: "miru@example.com",
          password: user.password
        }
      }
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq(I18n.t("sessions.failure.invalid"))
    end
  end

  context "when user is unconfirmed" do
    let(:user) { create(:user, confirmed_at: nil) }
    let(:valid_params) { { user: { email: user.email, password: user.password } } }

    it "returns an error message" do
      send_request :post, api_v1_users_login_path, params: valid_params

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)["error"]).to eq(I18n.t("devise.failure.unconfirmed"))
    end
  end

  context "when the user is not confirmed for miru desktop app" do
    let(:user) { create(:user, confirmed_at: nil) }
    let(:valid_params) { { user: { email: user.email, password: user.password } } }

    it "returns an error message" do
      send_request :post, api_v1_users_login_path(app: "miru-desktop"), params: valid_params

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)["error"]).to eq(I18n.t("devise.failure.unconfirmed"))
    end
  end

  context "when the account requires a passkey" do
    before do
      user.ensure_webauthn_id!
      options = relying_party.options_for_registration(
        user: {
          id: user.webauthn_id,
          name: user.email,
          display_name: user.full_name
        }
      )
      credential = fake_client.create(challenge: options.challenge, rp_id: "localhost")
      webauthn_credential = relying_party.verify_registration(credential, options.challenge)

      user.passkeys.create!(
        external_id: webauthn_credential.id,
        public_key: webauthn_credential.public_key,
        sign_count: webauthn_credential.sign_count,
        nickname: "Test passkey"
      )
      user.update!(passkey_required_for_login: true)
    end

    it "returns a passkey challenge instead of signing in immediately" do
      post api_v1_users_login_path, params: {
        user: {
          email: user.email,
          password: user.password
        }
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["requires_passkey"]).to eq(true)
      expect(json_response["pending_token"]).to be_present
      expect(json_response.dig("public_key", "challenge")).to be_present
      expect(json_response).not_to have_key("user")
    end

    it "asks miru mobile users to continue on the web app" do
      post api_v1_users_login_path(app: "miru-mobile"), params: {
        user: {
          email: user.email,
          password: user.password
        }
      }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq("This account requires a passkey. Sign in from the web app to continue.")
    end

    it "completes sign in with a valid passkey assertion" do
      post api_v1_users_login_path, params: {
        user: {
          email: user.email,
          password: user.password
        }
      }

      assertion = fake_client.get(
        challenge: json_response.dig("public_key", "challenge"),
        rp_id: "localhost",
        allow_credentials: [user.passkeys.first.external_id]
      )

      post "/api/v1/users/passkeys/authenticate", params: {
        pending_token: json_response["pending_token"],
        credential: assertion
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(I18n.t("devise.sessions.signed_in"))
      expect(json_response.dig("user", "email")).to eq(user.email)
      expect(json_response.dig("user", "token")).to be_present
    end
  end

  context "when the account requires an authenticator code" do
    before do
      user.reset_totp_setup!
      code = ROTP::TOTP.new(user.reload.otp_secret, issuer: User::TOTP_ISSUER).now
      user.verify_totp_code!(code)
      user.update!(otp_required_for_login: true)
      @recovery_codes = user.generate_recovery_codes!
    end

    it "returns a totp challenge instead of signing in immediately" do
      post api_v1_users_login_path, params: {
        user: {
          email: user.email,
          password: user.password
        }
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["requires_totp"]).to eq(true)
      expect(json_response["pending_token"]).to be_present
      expect(json_response).not_to have_key("user")
    end

    it "completes sign in with a valid authenticator code" do
      post api_v1_users_login_path, params: {
        user: {
          email: user.email,
          password: user.password
        }
      }

      travel 31.seconds
      code = ROTP::TOTP.new(user.reload.otp_secret, issuer: User::TOTP_ISSUER).now

      post "/api/v1/users/totp/authenticate", params: {
        pending_token: json_response["pending_token"],
        code:
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(I18n.t("devise.sessions.signed_in"))
      expect(json_response.dig("user", "email")).to eq(user.email)
    end

    it "completes sign in with a valid recovery code" do
      post api_v1_users_login_path, params: {
        user: {
          email: user.email,
          password: user.password
        }
      }

      post "/api/v1/users/totp/authenticate", params: {
        pending_token: json_response["pending_token"],
        recovery_code: @recovery_codes.first
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(I18n.t("devise.sessions.signed_in"))
      expect(json_response.dig("user", "email")).to eq(user.email)
    end
  end
end
