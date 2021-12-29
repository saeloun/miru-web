# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Users::SessionController", type: :request do
  let (:user) { create(:user) }
  let (:login_url) { "/users/sign_in" }

  context "When logging in" do
    before do
      post login_url, as: :json, params: { user: { email: user.email, password: user.password } }
    end

    it "returns a token" do
      expect(response.headers["Authorization"]).to be_present
    end

    it "returns 200" do
      expect(response.status).to eq(200)
    end
  end

  context "When password is missing" do
    before do
      post login_url, as: :json, params: {
        user: {
          email: user.email,
          password: nil
        }
      }
    end

    it "returns 401" do
      expect(response.status).to eq(401)
    end
  end

  context "When email is missing" do
    before do
      post login_url, as: :json, params: {
        user: {
          email: nil,
          password: user.password
        }
      }
    end

    it "returns 401" do
      expect(response.status).to eq(401)
    end
  end
end
