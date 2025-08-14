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

  context "when logged in on miru desktop app with valid email and password" do
    it "logs the user successfully" do
      send_request :post, internal_api_v1_users_login_path(app: "miru-desktop"), params: {
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

  context "when logged in with wrong combination of email and password" do
    it "not able to log in" do
      send_request :post, internal_api_v1_users_login_path, params: {
        user: {
          email: user.email,
          password: user.password + "abc"
        }
      }
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq(I18n.t("sessions.failure.invalid"))
    end
  end

  context "when logged in on miru desktop app with wrong combination of email and password" do
    it "not able to log in" do
      send_request :post, internal_api_v1_users_login_path(app: "miru-desktop"), params: {
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
      send_request :post, internal_api_v1_users_login_path, params: {
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
      send_request :post, internal_api_v1_users_login_path(app: "miru-desktop"), params: {
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
      send_request :post, internal_api_v1_users_login_path, params: valid_params

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)["error"]).to eq(I18n.t("devise.failure.unconfirmed"))
    end
  end

  context "when the user is not confirmed for miru desktop app" do
    let(:user) { create(:user, confirmed_at: nil) }
    let(:valid_params) { { user: { email: user.email, password: user.password } } }

    it "returns an error message" do
      send_request :post, internal_api_v1_users_login_path(app: "miru-desktop"), params: valid_params

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)["error"]).to eq(I18n.t("devise.failure.unconfirmed"))
    end
  end
end
