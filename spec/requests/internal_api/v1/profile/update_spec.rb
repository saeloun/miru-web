# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Profile#update", type: :request do
  let(:user) { create(:user, :with_avatar, password: "testing") }
  let(:company) { create(:company) }

  describe "update user details" do
    before do
      user.add_role :employee, company
      sign_in user
    end

    it "updates user data without password" do
      params = { user: { first_name: "Sam", last_name: "Smith" } }
      send_request(:put, internal_api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:ok)
      expect(user.first_name).to eq("Sam")
      expect(user.last_name).to eq("Smith")
      expect(json_response["notice"]).to eq("User updated")
    end

    it "updates user data with password" do
      params = {
        user: {
          first_name: "Example", last_name: "User", current_password: "testing", password: "123456",
          password_confirmation: "123456"
        }
      }
      send_request(:put, internal_api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:ok)
      expect(user.first_name).to eq("Example")
      expect(user.last_name).to eq("User")
      expect(json_response["notice"]).to eq("Password updated")
    end

    it "throws error when first name is blank" do
      params = {
        user: {
          first_name: "", last_name: "User"
        }
      }
      send_request(:put, internal_api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(
        ["First name can't be blank",
         "First name must only contain letters or spaces"])
    end

    it "throws error when last name is blank" do
      params = {
        user: {
          first_name: "Example", last_name: ""
        }
      }
      send_request(:put, internal_api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(
        ["Last name can't be blank",
         "Last name must only contain letters or spaces"])
    end

    it "throws error when name fields are invalid" do
      params = {
        user: {
          first_name: "@#", last_name: "@"
        }
      }
      send_request(:put, internal_api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(
        ["First name must only contain letters or spaces", "Last name must only contain letters or spaces"])
    end

    it "throws error when current password is incorrect" do
      params = {
        user: {
          first_name: "Example", last_name: "User", current_password: "incorrect", password: "123456",
          password_confirmation: "123456"
        }
      }
      send_request(:put, internal_api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(["Current password is invalid"])
    end

    it "throws error when password_confirmation does not match password" do
      params = {
        user: {
          first_name: "Example", last_name: "User", current_password: "testing", password: "123456",
          password_confirmation: "123098"
        }
      }
      send_request(:put, internal_api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(["Password confirmation doesn't match with new password"])
    end

    it "throws error when password is less than 6 of characters" do
      params = {
        user: {
          first_name: "Example", last_name: "User", current_password: "testing", password: "12345",
          password_confirmation: "12345"
        }
      }
      send_request(:put, internal_api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(["Password must be at least 6 characters long"])
    end
  end
end
