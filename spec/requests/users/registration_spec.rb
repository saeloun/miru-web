# frozen_string_literal: true

RSpec.describe "Users::RegistrationsController", type: :request do
  let(:user) { build(:user) }

  describe "POST /users" do
    it "registers a new user" do
      post "/users", params: { user: { first_name: user.first_name, last_name: user.last_name, email: user.email, password: user.password } }

      expect(response).to have_http_status(200)
    end
  end
end
