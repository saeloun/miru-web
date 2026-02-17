# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users::Passwords#create", type: :request do
  let(:user) { create(:user) }

  describe "POST #create" do
    context "with valid email" do
      it "sends password reset instructions" do
        send_request :post, api_v1_users_forgot_password_path, params: { user: { email: user.email } }
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to include(
          "notice" => I18n.t("password.create.success")
        )
      end
    end

    context "with invalid email" do
      it "responds with error message" do
        send_request :post, api_v1_users_forgot_password_path,
          params: { user: { email: "invalid@example.com" } }
        expect(response).to have_http_status(:unprocessable_content)
        expect(JSON.parse(response.body)).to include("error" => "Email not found")
      end
    end
  end
end
