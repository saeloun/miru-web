# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PreviousEmployments#update", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company2.id) }
  let(:employment) { create(:employment, user:, company:) }
  let!(:previous_employment) { PreviousEmployment.create(
    user:,
    company_name: Faker::Company.name,
    role: Faker::Company.profession
    )
  }

  before {
    @updated_previous_employment_details = {
      company_name: Faker::Company.name,
      role: Faker::Company.profession
    }
  }

  context "when Owner wants to update Previous Employments details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :patch, internal_api_v1_team_previous_employments_path(
        team_id: employment.id,
        params: {
          previous_employments: @updated_previous_employment_details
        }
      )
    end

    it "is successful" do
      previous_employment.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["previous_employments"][0]["company_name"]).to eq(
        JSON.parse(@updated_previous_employment_details[:company_name].to_json))
      expect(json_response["previous_employments"][0]["role"]).to eq(
        JSON.parse(@updated_previous_employment_details[:role].to_json))
    end
  end

  context "when Admin wants to update Previous Employments details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :patch, internal_api_v1_team_previous_employments_path(
        team_id: employment.id,
        params: {
          previous_employments: @updated_previous_employment_details
        })
    end

    it "is successful" do
      previous_employment.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["previous_employments"][0]["company_name"]).to eq(
        JSON.parse(@updated_previous_employment_details[:company_name].to_json))
      expect(json_response["previous_employments"][0]["role"]).to eq(
        JSON.parse(@updated_previous_employment_details[:role].to_json))
    end
  end

  context "when Employee wants to update his own Previous Employments details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_team_previous_employments_path(
        team_id: employment.id,
        params: {
          previous_employments: @updated_previous_employment_details
        })
    end

    it "is successful" do
      previous_employment.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["previous_employments"][0]["company_name"]).to eq(
        JSON.parse(@updated_previous_employment_details[:company_name].to_json))
      expect(json_response["previous_employments"][0]["role"]).to eq(
        JSON.parse(@updated_previous_employment_details[:role].to_json))
    end
  end

  context "when logged in user wants to update Previous Employments details of
    another employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :employee, company
      user2.add_role :employee, company2
      sign_in user
      send_request :patch, internal_api_v1_team_previous_employments_path(
        team_id: employment2.id,
        params: {
          previous_employments: @updated_previous_employment_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in user wants to update Previous Employments details of
    another employee from his own company" do
    before do
      employment2 = create(:employment, user: user2, company:)
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_team_previous_employments_path(
        team_id: employment2.id,
        params: {
          previous_employments: @updated_previous_employment_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in Owner wants to update Previous Employments details of
    employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :owner, company
      user2.add_role :employee, company2
      sign_in user
      send_request :patch, internal_api_v1_team_previous_employments_path(
        team_id: employment2.id,
        params: {
          previous_employments: @updated_previous_employment_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end

  context "when logged in Admin wants to update Previous Employments details of
    employee from a different company" do
    before do
      employment2 = create(:employment, user: user2, company: company2)
      user.add_role :admin, company
      user2.add_role :employee, company2
      sign_in user
      send_request :patch, internal_api_v1_team_previous_employments_path(
        team_id: employment2.id,
        params: {
          previous_employments: @updated_previous_employment_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
