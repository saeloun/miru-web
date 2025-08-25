# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PreviousEmployments#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:previous_employment_of_employee) { create(:previous_employment, user: employee) }
  let(:previous_employment_of_user) { create(:previous_employment, user:) }
  let(:updated_previous_employment_details) { attributes_for(:previous_employment) }

  context "when Owner wants to update Previous Employments details of an employee of his company" do
    before do
      create(:employment, company:, user:)
      create(:employment, company:, user: employee)
      user.add_role :owner, company
      employee.add_role :employee, company
      sign_in user
      send_request :patch, api_v1_user_previous_employment_path(
        user_id: employee.id,
        id: previous_employment_of_employee.id,
        params: {
          previous_employment: updated_previous_employment_details
        }
      ), headers: auth_headers(user)
    end

    it "is successful" do
      previous_employment_of_employee.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["company_name"]).to eq(updated_previous_employment_details[:company_name])
      expect(json_response["role"]).to eq(updated_previous_employment_details[:role])
    end
  end

  context "when Admin wants to update Previous Employments details of employee of his company" do
    before do
      create(:employment, company:, user:)
      create(:employment, company:, user: employee)
      user.add_role :admin, company
      sign_in user
      send_request :patch, api_v1_user_previous_employment_path(
        user_id: employee.id,
        id: previous_employment_of_employee.id,
        params: {
          previous_employment: updated_previous_employment_details
        }
      ), headers: auth_headers(user)
    end

    it "is successful" do
      previous_employment_of_employee.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["company_name"]).to eq(updated_previous_employment_details[:company_name])
      expect(json_response["role"]).to eq(updated_previous_employment_details[:role])
    end
  end

  context "when Employee wants to update his own Previous Employments details" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request :patch, api_v1_user_previous_employment_path(
        user_id: user.id,
        id: previous_employment_of_user.id,
        params: {
          previous_employment: updated_previous_employment_details
        }
      ), headers: auth_headers(user)
    end

    it "is forbidden" do
      previous_employment_of_user.reload
      expect(response).to have_http_status(:ok)
      expect(json_response["company_name"]).to eq(updated_previous_employment_details[:company_name])
      expect(json_response["role"]).to eq(updated_previous_employment_details[:role])
    end
  end
end
