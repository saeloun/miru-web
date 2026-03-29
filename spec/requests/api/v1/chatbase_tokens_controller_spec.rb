# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::ChatbaseTokensController, type: :request do
  describe "GET /api/v1/chatbase_token" do
    around do |example|
      original_secret = ENV["CHATBASE_IDENTITY_SECRET"]
      ENV["CHATBASE_IDENTITY_SECRET"] = "chatbase-test-secret"
      example.run
    ensure
      ENV["CHATBASE_IDENTITY_SECRET"] = original_secret
    end

    it "returns a signed token for a browser-session user" do
      user = create(:user, first_name: "Vipul", last_name: "Amler")
      create(:employment, user:, company: user.current_workspace)
      sign_in user

      get "/api/v1/chatbase_token"

      expect(response).to have_http_status(:ok)

      payload, = JWT.decode(response.parsed_body["token"], "chatbase-test-secret", true, algorithm: "HS256")

      expect(payload).to include(
        "user_id" => user.id,
        "email" => user.email,
        "name" => user.full_name,
        "company" => user.current_workspace.name
      )
      expect(payload["exp"]).to be_present
    end

    it "returns unauthorized without an authenticated user" do
      get "/api/v1/chatbase_token"

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
