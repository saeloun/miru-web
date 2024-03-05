# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::TeamMembers::DetailsController::#update", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company2.id) }
  let(:employment) { create(:employment, user:, company:) }

  before {
    @user_details = {
      # first name is kept the same for testing, rest all fields are updated
      first_name: user.first_name,
      last_name: Faker::Alphanumeric.alpha(number: 2..10),
      phone: Faker::PhoneNumber.phone_number_with_country_code,
      date_of_birth: Faker::Date.between(from: "1990-01-01", to: "2000-01-01"),
      personal_email_id: Faker::Internet.email,
      social_accounts: {
        "github_url": "#{user.first_name}.github",
        "linkedin_url": "#{user.first_name}.linkedin"
      }
    }
  }

  context "when Owner wants to update details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :patch, internal_api_v1_team_details_path(
        team_id: employment.user_id,
        params: {
          user: @user_details
        }), headers: auth_headers(user)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["first_name"]).to eq(JSON.parse(@user_details["first_name"].to_json))
      expect(json_response["last_name"]).to eq(JSON.parse(@user_details["last_name"].to_json))
      expect(json_response["personal_email_id"]).to eq(JSON.parse(@user_details["personal_email_id"].to_json))
      expect(json_response["date_of_birth"]).to eq(JSON.parse(@user_details["date_of_birth"].to_json))
      expect(json_response["phone"]).to eq(JSON.parse(@user_details["phone"].to_json))
      expect(json_response["social_accounts"]).to eq(JSON.parse(@user_details["social_accounts"].to_json))
    end
  end

  context "when Admin wants to update details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :patch, internal_api_v1_team_details_path(
        team_id: employment.user_id,
        params: {
          user: @user_details
        }), headers: auth_headers(user)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["first_name"]).to eq(JSON.parse(@user_details["first_name"].to_json))
      expect(json_response["last_name"]).to eq(JSON.parse(@user_details["last_name"].to_json))
      expect(json_response["personal_email_id"]).to eq(JSON.parse(@user_details["personal_email_id"].to_json))
      expect(json_response["date_of_birth"]).to eq(JSON.parse(@user_details["date_of_birth"].to_json))
      expect(json_response["phone"]).to eq(JSON.parse(@user_details["phone"].to_json))
      expect(json_response["social_accounts"]).to eq(JSON.parse(@user_details["social_accounts"].to_json))
    end
  end

  context "when Employee wants to update his own details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_team_details_path(
        team_id: employment.user_id,
        params: {
          user: @user_details
        }), headers: auth_headers(user)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in user wants to update details of another employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :employee, company
      user2.add_role :employee, company2
      sign_in user
      send_request :patch, internal_api_v1_team_details_path(
        team_id: employment2.user_id,
        params: {
          user: @user_details
        }), headers: auth_headers(user)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in user wants to update details of another employee from his own company" do
    before do
      employment2 = create(:employment, user: user2, company:)
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_team_details_path(
        team_id: employment2.user_id,
        params: {
          user: @user_details
        }), headers: auth_headers(user)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in Owner wants to update details of another employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :owner, company
      user2.add_role :employee, company2
      sign_in user
      send_request :patch, internal_api_v1_team_details_path(
        team_id: employment2.user_id,
        params: {
          user: @user_details
        }), headers: auth_headers(user)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in Admin wants to update details of another employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :admin, company
      user2.add_role :employee, company2
      sign_in user
      send_request :patch, internal_api_v1_team_details_path(
        team_id: employment2.user_id,
        params: {
          user: @user_details
        }), headers: auth_headers(user)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
