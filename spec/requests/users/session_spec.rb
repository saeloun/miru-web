# frozen_string_literal: true

RSpec.describe "Users::SessionController", type: :request do
  let (:user) { create(:user) }
  let (:login_url) { "/users/sign_in" }
  let (:logout_url) { "/users/sign_out" }

  context "When logging in" do
    before do
      post login_url, params: { user: { email: user.email, password: user.password } }
    end

    it "returns a token" do
      expect(response.headers["Authorization"]).to be_present
    end

    it "returns 200" do
      expect(response.status).to eq(200)
    end
  end
end
