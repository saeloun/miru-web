# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users::Registrations#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "welcome12") }
  let(:desktop_signup_json) do
    {
      email: generate(:user_email),
      first_name: "Desktop",
      last_name: "Smoke",
      locale: "en",
      password: "Password123!"
    }
  end

  context "when signs up with valid info" do
    valid_email = "miru@example.com"

    valid_user_json = {
      email: valid_email,
      first_name: "Miru",
      last_name: "Smith",
      password: "welcome12",
      password_confirmation: "welcome12",
      phone_number: "1(555)555-5555"
    }

    it "creates user successfully" do
      send_request :post, api_v1_users_signup_path, params: {
        user: valid_user_json
      }
      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(I18n.t("devise.registrations.signed_up"))
      expect(json_response.dig("agent_payment_options", "stripe_link_cli")).to include(
        "provider" => "stripe_link_cli",
        "checkout_endpoint" => "/api/v1/subscription/checkout",
        "requires_authenticated_workspace" => true
      )
    end

    it "creates user successfully from the desktop app payload" do
      send_request :post, api_v1_users_signup_path, params: {
        user: desktop_signup_json
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(I18n.t("devise.registrations.signed_up"))
      expect(json_response["email"]).to eq(desktop_signup_json[:email])
      expect(User.find_by!(email: desktop_signup_json[:email]).locale).to eq("en-US")
    end

    it "does not require a browser csrf token for JSON desktop signup" do
      with_forgery_protection do
        post api_v1_users_signup_path, params: {
          user: desktop_signup_json.merge(email: generate(:user_email))
        }, as: :json
      end

      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(I18n.t("devise.registrations.signed_up"))
    end

    it "creates user successfully from the desktop app payload" do
      send_request :post, api_v1_users_signup_path, params: {
        user: desktop_signup_json
      }

      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(I18n.t("devise.registrations.signed_up"))
      expect(json_response["email"]).to eq(desktop_signup_json[:email])
      expect(User.find_by!(email: desktop_signup_json[:email]).locale).to eq("en-US")
    end

    it "does not require a browser csrf token for JSON desktop signup" do
      with_forgery_protection do
        post api_v1_users_signup_path, params: {
          user: desktop_signup_json.merge(email: generate(:user_email))
        }, as: :json
      end

      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(I18n.t("devise.registrations.signed_up"))
    end
  end

  context "when signs up with invalid info" do
    valid_email = "miru@example.com"

    let(:valid_user_json) { {
      email: user.email,
      first_name: "Miru",
      last_name: "Smith",
      password: "welcome12",
      password_confirmation: "welcome12",
      phone_number: "1(555)555-5555"
    }
}

    it "wont create user if email already exists" do
      send_request :post, api_v1_users_signup_path, params: {
        user: valid_user_json
      }
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq({ "email" => ["Email ID already exists"] })
    end

    it "wont create user if password is not matching" do
      valid_user_json["email"] = valid_email
      valid_user_json["password_confirmation"] = "welcome1234"
      send_request :post, api_v1_users_signup_path, params: {
        user: valid_user_json
      }
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq({ "password_confirmation" => ["doesn't match with new password"] })
    end
  end
end
