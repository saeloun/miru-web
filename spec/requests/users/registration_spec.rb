# frozen_string_literal: true

RSpec.describe "Users::RegistrationsController", type: :request do
  let (:user) { build(:user) }
  let (:create_user) { create(:user) }
  let (:signup_url) { "/users" }

  context "When creating a new user" do
    before do
      post signup_url, params: {
        user: {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          password: user.password
        }
      }
    end

    it "returns 200" do
      expect(response.status).to eq(200)
    end

    it "returns a token" do
      expect(response.headers["Authorization"]).to be_present
    end
  end
end
