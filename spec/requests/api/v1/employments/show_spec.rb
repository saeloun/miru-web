# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Employments#show", type: :request do
  let!(:company) { create(:company) }
  let!(:user) { create(:user, current_workspace_id: company.id) }
  let!(:employment) { create(:employment, company_id: company.id, user_id: user.id) }

  context "when user is an admin" do
    before do
      user.add_role :admin, company
      sign_in user
      get api_v1_employment_path(user), headers: auth_headers(user)
    end

    it "returns the success" do
      expect(response).to have_http_status(:ok)
    end

    it "returns the employment details" do
      expect(json_response["employment"]["designation"]).to eq(employment.designation)
      expect(json_response["employment"]["id"]).to eq(employment.id)
      expect(json_response["employment"]["employment_type"]).to eq(employment.employment_type)
      expect(json_response["employment"]["joined_at"]).to eq(employment.joined_at.strftime("%m.%d.%Y"))
      expect(json_response["employment"]["resigned_at"]).to eq(employment.resigned_at.strftime("%m.%d.%Y"))
      expect(json_response["employment"]["employee_id"]).to eq(employment.employee_id)
      expect(json_response["employment"]["email"]).to eq(user.email)
    end
  end

  context "when user is an employee" do
    before do
      user.add_role :employee, company
      sign_in user
      get api_v1_employment_path(user), headers: auth_headers(user)
    end

    it "forbids the user to access the employment details" do
      expect(response).to have_http_status(:ok)
      expect(json_response["employment"]["designation"]).to eq(employment.designation)
      expect(json_response["employment"]["id"]).to eq(employment.id)
      expect(json_response["employment"]["employment_type"]).to eq(employment.employment_type)
      expect(json_response["employment"]["joined_at"]).to eq(employment.joined_at.strftime("%m.%d.%Y"))
      expect(json_response["employment"]["resigned_at"]).to eq(employment.resigned_at.strftime("%m.%d.%Y"))
      expect(json_response["employment"]["employee_id"]).to eq(employment.employee_id)
      expect(json_response["employment"]["email"]).to eq(user.email)
    end
  end

  context "when user is a book keeper" do
    before do
      user.add_role :book_keeper, company
      sign_in user
      get api_v1_employment_path(user), headers: auth_headers(user)
    end

    it "forbids the user to access the employment details" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
