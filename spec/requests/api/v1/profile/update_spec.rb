# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Profile#update", type: :request do
  let(:user) { create(:user, password: "testing12") }
  let(:company) { create(:company) }

  describe "update user details" do
    before do
      user.add_role :employee, company
      sign_in user
    end

    it "updates user data without password" do
      params = { user: { first_name: "Sam", last_name: "Smith" } }
      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:ok)
      expect(user.first_name).to eq("Sam")
      expect(user.last_name).to eq("Smith")
      expect(json_response["notice"]).to eq(I18n.t("companies.update.success"))
    end

    it "updates the preferred locale" do
      params = { user: { locale: "mr" } }

      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))

      expect(response).to have_http_status(:ok)
      expect(user.reload.locale).to eq("mr")
      expect(json_response["notice"]).to eq(I18n.t("companies.update.success"))
    end

    it "updates user data with password" do
      previous_password_changed_at = user.reload.password_changed_at
      params = {
        user: {
          first_name: "Example", last_name: "User", current_password: "testing12", password: "12345678",
          password_confirmation: "12345678"
        }
      }
      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:ok)
      expect(user.reload.first_name).to eq("Example")
      expect(user.last_name).to eq("User")
      expect(user.password_changed_at).to be > previous_password_changed_at
      expect(json_response["notice"]).to eq(I18n.t("password.update.success"))
      expect(json_response.dig("user", "password_changed_at")).to be_present
    end

    it "throws error when first name is blank" do
      params = {
        user: {
          first_name: "", last_name: "User"
        }
      }
      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))
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
      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))
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
      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(
        ["First name must only contain letters or spaces", "Last name must only contain letters or spaces"])
    end

    it "throws error when current password is incorrect" do
      params = {
        user: {
          first_name: "Example", last_name: "User", current_password: "incorrect", password: "12345678",
          password_confirmation: "12345678"
        }
      }
      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(["Current password is invalid"])
    end

    it "throws error when password_confirmation does not match password" do
      params = {
        user: {
          first_name: "Example", last_name: "User", current_password: "testing12", password: "12345678",
          password_confirmation: "87654321"
        }
      }
      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(["Password confirmation doesn't match with new password"])
    end

    it "throws error when password is less than 8 characters" do
      params = {
        user: {
          first_name: "Example", last_name: "User", current_password: "testing12", password: "1234567",
          password_confirmation: "1234567"
        }
      }
      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(["Password must be at least 8 characters long"])
    end

    it "throws error when new password is same as current password" do
      params = {
        user: {
          first_name: "Example", last_name: "User", current_password: "testing12", password: "testing12",
          password_confirmation: "testing12"
        }
      }

      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(["Password must be different from current password"])
    end

    it "throws current password error when current password is incorrect even if new password matches existing password" do
      params = {
        user: {
          first_name: "Example", last_name: "User", current_password: "incorrect", password: "testing12",
          password_confirmation: "testing12"
        }
      }

      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(["Current password is invalid"])
    end

    it "ignores unexpected social account keys" do
      params = {
        user: {
          social_accounts: {
            github_url: "https://github.com/sam",
            linkedin_url: "https://linkedin.com/in/sam",
            admin: true
          }
        }
      }
      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))
      expect(response).to have_http_status(:ok)
      expect(user.reload.social_accounts).to eq(
        "github_url" => "https://github.com/sam",
        "linkedin_url" => "https://linkedin.com/in/sam"
      )
    end

    it "rejects a future date of birth" do
      params = { user: { date_of_birth: (Date.current + 1.day).iso8601 } }

      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(["Date of birth cannot be in the future"])
    end

    it "rejects a phone number longer than 15 digits" do
      params = { user: { phone: "+1234567890123456" } }

      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to include("Phone is invalid")
    end

    it "rejects a phone number shorter than 2 digits" do
      params = { user: { phone: "+1" } }

      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to include("Phone is invalid")
    end

    it "rejects an invalid Indian phone number" do
      params = { user: { phone: "+9198765432101" } }

      send_request(:put, api_v1_profile_path, params:, headers: auth_headers(user))

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["errors"]).to eq(["Phone is invalid"])
    end
  end
end
