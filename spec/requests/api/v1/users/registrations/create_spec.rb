# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Users::Registrations#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id, password: "welcome") }

  context "when signs up with valid info" do
    valid_email = "miru@example.com"

    valid_user_json = {
      email: valid_email,
      first_name: "Miru",
      last_name: "Smith",
      password: "welcome",
      password_confirmation: "welcome",
      phone_number: "1(555)555-5555"
    }

    it "creates user successfully" do
      send_request :post, api_v1_users_signup_path, params: {
        user: valid_user_json
      }
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
      password: "welcome",
      password_confirmation: "welcome",
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
      valid_user_json["password_confirmation"] = "welcome123"
      send_request :post, api_v1_users_signup_path, params: {
        user: valid_user_json
      }
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq({ "password_confirmation" => ["doesn't match with new password"] })
    end
  end
end
