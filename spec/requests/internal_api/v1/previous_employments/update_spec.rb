# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PreviousEmployments#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company.id) }
  let!(:previous_employment) { create(:previous_employment, user:) }
  let!(:previous_employment2) { create(:previous_employment, user: user2) }
  let!(:updated_previous_employment_details) { attributes_for(:previous_employment) }

  context "when Owner wants to update Previous Employments details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :patch, internal_api_v1_previous_employment_path(
        id: previous_employment.id,
        params: {
          previous_employment: updated_previous_employment_details
        }
      )
    end

    it "is successful" do
      previous_employment.reload
      expect(response).to have_http_status(:ok)
    end
  end

  context "when Admin wants to update Previous Employments details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :patch, internal_api_v1_previous_employment_path(
        id: previous_employment.id,
        params: {
          previous_employment: updated_previous_employment_details
        })
    end

    it "is successful" do
      previous_employment.reload
      expect(response).to have_http_status(:ok)
    end
  end

  context "when Employee wants to update his own Previous Employments details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_previous_employment_path(
        id: previous_employment.id,
        params: {
          previous_employment: updated_previous_employment_details
        })
    end

    it "is successful" do
      previous_employment.reload
      expect(response).to have_http_status(:ok)
    end
  end

  context "when logged in user wants to update Previous Employments details of
    another employee from his own company" do
    before do
      user.add_role :employee, company
      user2.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_previous_employment_path(
        id: previous_employment2.id,
        params: {
          previous_employment: @updated_previous_employment_details
        })
    end

    it "is unsuccessful" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
