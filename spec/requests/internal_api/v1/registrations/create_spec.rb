# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Registrations#create", type: :request do
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
      send_request :post, internal_api_v1_signup_path, params: {
        user: valid_user_json
      }
      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq("Signed up successfully")
    end
  end

  context "when signs up with invalid info" do
    valid_email = "miru@example.com"

    valid_user_json = {
      email: valid_email,
      first_name: "Miru",
      last_name: "Smith",
      password: nil,
      password_confirmation: nil,
      phone_number: "1(555)555-5555"
    }

    it "wont create user" do
      send_request :post, internal_api_v1_signup_path, params: {
        user: valid_user_json
      }
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response["error"]).to eq({ "password" => ["can't be blank"] })
    end
  end
end
