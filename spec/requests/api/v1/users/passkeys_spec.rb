# frozen_string_literal: true

require "rails_helper"
require "webauthn/fake_client"

RSpec.describe "Api::V1::Users::Passkeys", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "welcome") }
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
    sign_in(user)
  end

  describe "GET /api/v1/users/passkeys" do
    it "returns the current user's passkeys" do
      get "/api/v1/users/passkeys"

      expect(response).to have_http_status(:ok)
      expect(json_response["passkeys"]).to eq([])
      expect(json_response["passkey_required_for_login"]).to eq(false)
    end
  end

  describe "POST /api/v1/users/passkeys/registration_options" do
    it "returns registration options and persists a webauthn id" do
      post "/api/v1/users/passkeys/registration_options"

      expect(response).to have_http_status(:ok)
      expect(json_response["challenge_token"]).to be_present
      expect(json_response.dig("public_key", "challenge")).to be_present
      expect(user.reload.webauthn_id).to be_present
    end
  end

  describe "POST /api/v1/users/passkeys" do
    it "registers a passkey" do
      post "/api/v1/users/passkeys/registration_options"

      credential = fake_client.create(challenge: json_response.dig("public_key", "challenge"), rp_id: "localhost")

      post "/api/v1/users/passkeys", params: {
        challenge_token: json_response["challenge_token"],
        credential:
      }

      expect(response).to have_http_status(:created)
      expect(user.reload.passkeys.count).to eq(1)
      expect(json_response["passkeys"].length).to eq(1)
      expect(json_response["notice"]).to eq("Passkey added")
    end
  end

  describe "PATCH /api/v1/users/passkeys/requirement" do
    it "rejects enabling requirement without a passkey" do
      patch "/api/v1/users/passkeys/requirement", params: { required: true }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq("Add a passkey before requiring it for sign in.")
    end
  end

  describe "DELETE /api/v1/users/passkeys/:id" do
    it "removes a passkey and clears the requirement when last passkey is deleted" do
      passkey = register_passkey
      user.update!(passkey_required_for_login: true)

      delete "/api/v1/users/passkeys/#{passkey.id}"

      expect(response).to have_http_status(:ok)
      expect(user.reload.passkeys.count).to eq(0)
      expect(user.passkey_required_for_login).to eq(false)
    end
  end

  def register_passkey
    post "/api/v1/users/passkeys/registration_options"
    challenge_token = json_response["challenge_token"]
    challenge = json_response.dig("public_key", "challenge")

    credential = fake_client.create(challenge:, rp_id: "localhost")

    post "/api/v1/users/passkeys", params: {
      challenge_token:,
      credential:
    }

    user.reload.passkeys.first
  end
end
