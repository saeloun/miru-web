# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Users::Passwords#update", type: :request do
  let(:user) { create(:user) }

  describe "PUT #update" do
    context "with valid token and passwords" do
      it "updates user password" do
        user.send_reset_password_instructions
        token = user.send(:set_reset_password_token)
        send_request :put, internal_api_v1_users_reset_password_path, params: {
          user: {
            reset_password_token: token, password: "newpassword",
            password_confirmation: "newpassword"
          }
        }
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to include("notice" => I18n.t("password.update.success"))
      end
    end

    context "with invalid token" do
      it "responds with error message" do
        send_request :put, internal_api_v1_users_reset_password_path, params: {
          user: {
            reset_password_token: "invalidtoken", password: "newpassword",
            password_confirmation: "newpassword"
          }
        }
        expect(response).to have_http_status(:unprocessable_content)
        expect(JSON.parse(response.body)).to include("error" => "Reset password token is invalid")
      end
    end

    context "with mismatching passwords" do
      it "responds with error message" do
        user.send_reset_password_instructions
        token = user.send(:set_reset_password_token)
        send_request :put, internal_api_v1_users_reset_password_path, params: {
          user: {
            reset_password_token: token, password: "newpassword",
            password_confirmation: "differentpassword"
          }
        }
        expect(response).to have_http_status(:unprocessable_content)
        expect(JSON.parse(response.body)).to include(
          "error" => "Password confirmation doesn't match with new password"
        )
      end
    end
  end
end
