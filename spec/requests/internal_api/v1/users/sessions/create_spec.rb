# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Users::Sessions#create", type: :request do
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
      expect(json_response["notice"]).to eq(I18n.t("devise.sessions.signed_in"))
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
      expect(json_response["error"]).to eq(I18n.t("sessions.failure.invalid"))
    end
  end

  context "when logged in with invalid email of a user who does not exist" do
    it "not able to log in" do
      send_request :post, internal_api_v1_users_login_path, params: {
        user: {
          email: "miru@example.com",
          password: user.password
        }
      }
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["error"]).to eq(I18n.t("sessions.failure.invalid"))
    end
  end

  context "when user is unconfirmed" do
    let(:user) { create(:user, confirmed_at: nil) } # Create an unconfirmed user
    let(:valid_params) { { user: { email: user.email, password: user.password } } }

    it "returns an error message" do
      send_request :post, internal_api_v1_users_login_path, params: valid_params

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)["error"]).to eq(I18n.t("devise.failure.unconfirmed"))
    end
  end
end
