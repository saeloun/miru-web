# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PreviousEmployments#show", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company.id) }
  let(:previous_employment) { create(:previous_employment, user:) }

  context "when Owner wants to see Previous Employments of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :get, internal_api_v1_user_previous_employments_path(previous_employment)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["previous_employments"][0]["company_name"]).to eq(previous_employment.company_name)
      expect(json_response["previous_employments"][0]["role"]).to eq(previous_employment.role)
    end
  end

  context "when Admin wants to see Previous Employments of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :get, internal_api_v1_user_previous_employments_path(previous_employment)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["previous_employments"][0]["company_name"]).to eq(previous_employment.company_name)
      expect(json_response["previous_employments"][0]["role"]).to eq(previous_employment.role)
    end
  end

  context "when logged in user checks his own details" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_user_previous_employments_path(previous_employment)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["previous_employments"][0]["company_name"]).to eq(previous_employment.company_name)
      expect(json_response["previous_employments"][0]["role"]).to eq(previous_employment.role)
    end
  end

  context "when Employee wants to see Previous Employments of another employee of same company" do
    before do
      create(:employment, company:, user:)
      create(:employment, company:, user: user2)
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user2
      send_request :get, internal_api_v1_user_previous_employments_path(previous_employment)
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
