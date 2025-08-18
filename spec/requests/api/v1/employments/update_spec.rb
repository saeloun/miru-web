# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Employments#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:employment) { create(:employment, company_id: company.id, user_id: user.id) }

  context "when user is an admin" do
    before do
      user.add_role :admin, company
      sign_in user
    end

    context "when employment is valid" do
      before do
        send_request(
          :patch, api_v1_employment_path(user), params: {
            employment: {
              designation: "Software Engineer",
              employment_type: "Consultant",
              employee_id: "SA123"
            }
          }, headers: auth_headers(user))
      end

      it "updates employment" do
        employment.reload
        expect(employment.designation).to eq("Software Engineer")
        expect(employment.employment_type).to eq("Consultant")
        expect(employment.employee_id).to eq("SA123")
      end

      it "returns success notice" do
        expect(json_response["notice"]).to match("Employment updated successfully")
      end
    end
  end

  context "when user is an employee" do
    before do
      user.add_role :employee, company
      sign_in user
      send_request(
        :patch, api_v1_employment_path(user), params: {
          employment: {
            designation: "Software Engineer",
            employment_type: "Consultant",
            employee_id: "SA123"
          }
        }, headers: auth_headers(user))
    end

    it "updates employment" do
      employment.reload
      expect(employment.designation).to eq("Software Engineer")
      expect(employment.employment_type).to eq("Consultant")
      expect(employment.employee_id).to eq("SA123")
      expect(json_response["notice"]).to match("Employment updated successfully")
    end
  end

  context "when user is a book keeper" do
    before do
      user.add_role :book_keeper, company
      sign_in user
      send_request(
        :patch, api_v1_employment_path(user), params: {
          employment: {
            designation: "Software Engineer",
            employment_type: "Consultant",
            employee_id: "SA123"
          }
        }, headers: auth_headers(user))
    end

    it "forbids the user to update the employment details" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
    end
  end
end
