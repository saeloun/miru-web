# frozen_string_literal: true

RSpec.describe "Users::RegistrationsController", type: :request do
  let(:user) { build(:user) }

  describe "POST /users" do
    it "registers a new user" do
      post "/users", params: { user: { first_name: user.first_name, last_name: user.last_name, email: user.email, password: user.password } }

      expect(response).to have_http_status(201)
    end

    it "checks if the first_name is nil" do
      post "/users", params: { user: { first_name: nil, last_name: user.last_name, email: user.email, password: user.password } }

      expect(response).to have_http_status(422)
    end

    it "checks if the last_name is nil" do
      post "/users", params: { user: { first_name: user.first_name, last_name: nil, email: user.email, password: user.password } }

      expect(response).to have_http_status(422)
    end

    it "checks if the email is nil" do
      post "/users", params: { user: { first_name: user.first_name, last_name: user.last_name, email: nil, password: user.password } }

      expect(response).to have_http_status(422)
    end

    it "checks if the password is nil" do
      post "/users", params: { user: { first_name: user.first_name, last_name: user.last_name, email: user.email, password: nil } }

      expect(response).to have_http_status(422)
    end
  end
end
