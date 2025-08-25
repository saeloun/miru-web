# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TeamMembers::DetailsController#show", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, :with_avatar, current_workspace_id: company.id) }
  let(:user2) { create(:user, :with_avatar, current_workspace_id: company2.id) }
  let(:employment) { create(:employment, user:, company:) }

  context "when Owner wants to see details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :get, api_v1_team_details_path(employment.user_id), headers: auth_headers(user)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["first_name"]).to eq(JSON.parse(user.first_name.to_json))
      expect(json_response["last_name"]).to eq(JSON.parse(user.last_name.to_json))
      expect(json_response["personal_email_id"]).to eq(JSON.parse(user.personal_email_id.to_json))
      expect(json_response["date_of_birth"]).to eq(JSON.parse(user.date_of_birth.to_json))
      expect(json_response["phone"]).to eq(JSON.parse(user.phone.to_json))
      expect(json_response["social_accounts"]).to eq(JSON.parse(user.social_accounts.to_json))
    end
  end

  context "when Admin wants to see details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :get, api_v1_team_details_path(employment.user_id), headers: auth_headers(user)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["first_name"]).to eq(JSON.parse(user.first_name.to_json))
      expect(json_response["last_name"]).to eq(JSON.parse(user.last_name.to_json))
      expect(json_response["personal_email_id"]).to eq(JSON.parse(user.personal_email_id.to_json))
      expect(json_response["date_of_birth"]).to eq(JSON.parse(user.date_of_birth.to_json))
      expect(json_response["phone"]).to eq(JSON.parse(user.phone.to_json))
      expect(json_response["social_accounts"]).to eq(JSON.parse(user.social_accounts.to_json))
    end
  end

  context "when logged in user checks his own details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :get, api_v1_team_details_path(employment.user_id), headers: auth_headers(user)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["avatar_url"]).to eq(JSON.parse(user.avatar_url.to_json))
      expect(json_response["first_name"]).to eq(JSON.parse(user.first_name.to_json))
      expect(json_response["last_name"]).to eq(JSON.parse(user.last_name.to_json))
      expect(json_response["personal_email_id"]).to eq(JSON.parse(user.personal_email_id.to_json))
      expect(json_response["date_of_birth"]).to eq(JSON.parse(user.date_of_birth.to_json))
      expect(json_response["phone"]).to eq(JSON.parse(user.phone.to_json))
      expect(json_response["social_accounts"]).to eq(JSON.parse(user.social_accounts.to_json))
    end
  end

  context "when Owner of a company accesses employee details of another company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :owner, company
      user2.add_role :employee, company2
      sign_in user
      send_request :get, api_v1_team_details_path(employment2.user_id), headers: auth_headers(user)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when Admin of a company accesses employee details of another company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :admin, company
      user2.add_role :employee, company2
      sign_in user
      send_request :get, api_v1_team_details_path(employment2.user_id), headers: auth_headers(user)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when Employee wants to see details of another employee from different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :employee, company
      user2.add_role :employee, company2
      sign_in user
      send_request :get, api_v1_team_details_path(employment2.user_id), headers: auth_headers(user)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when Employee wants to see details of another employee from same company" do
    before do
      create(:employment, user:, company:)
      employment2 = create(:employment, user: user2, company:)
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request :get, api_v1_team_details_path(employment2.user_id), headers: auth_headers(user)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
