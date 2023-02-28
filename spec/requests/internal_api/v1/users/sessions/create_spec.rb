# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Sessions#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "welcome") }

  context "when logged in with valid email and password" do
    it "logs the user successfully" do
      send_request :post, internal_api_v1_users_login_path, params: {
        user: {
          email: user.email,
          password: user.password
        }
      }
      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq("Signed in successfully")
    end
  end

  context "when logged in with wrong combination of email and password" do
    it "not able to log in" do
      send_request :post, internal_api_v1_users_login_path, params: {
        user: {
          email: user.email,
          password: user.password + "abc"
        }
      }
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["error"]).to eq("Invalid email or password")
    end
  end
end
