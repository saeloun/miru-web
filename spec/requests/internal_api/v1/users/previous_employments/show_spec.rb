# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PreviousEmployments#show", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let!(:previous_employment_of_employee) { create(:previous_employment, user: employee) }
  let!(:previous_employment_of_user) { create(:previous_employment, user:) }

  context "when user is Admin or Owner" do
    before do
      create(:employment, company:, user:)
    end

    context "when logged in user user is Owner" do
      context "when Owner wants to see his own record" do
        before do
          user.add_role :owner, company
          sign_in user
          send_request :get, internal_api_v1_user_previous_employments_path(user, previous_employment_of_user)
        end

        it "is successful" do
          expect(response).to have_http_status(:ok)
          expect(json_response["previous_employments"][0]["company_name"]
            ).to eq(previous_employment_of_user.company_name)
          expect(json_response["previous_employments"][0]["role"]
            ).to eq(previous_employment_of_user.role)
        end
      end

      context "when Owner wants to see record of an employee of his company" do
        before do
          employee.add_role :employee, company
          create(:employment, company:, user:)
          user.add_role :owner, company
          sign_in user
          send_request :get, internal_api_v1_user_previous_employments_path(employee, previous_employment_of_employee)
        end

        it "is successful" do
          expect(response).to have_http_status(:ok)
          expect(json_response["previous_employments"][0]["company_name"]
            ).to eq(previous_employment_of_employee.company_name)
          expect(json_response["previous_employments"][0]["role"]
            ).to eq(previous_employment_of_employee.role)
        end
      end

      context "when owner sends request to see record for user id which doesnt exist" do
        before do
          create(:employment, company:, user:)
          user.add_role :owner, company
          sign_in user
          get "/internal_api/v1/user/#{user.id}/previous_employments/abc"
        end

        it "is not found" do
          expect(response).to have_http_status(:not_found)
        end
      end

      context "when owner sends request with invalid user id for a particular record" do
        before do
          create(:employment, company:, user:)
          user.add_role :owner, company
          sign_in user
          get "/internal_api/v1/user/#{user.id}/previous_employments/#{previous_employment_of_employee.id}"
        end

        it "is not found" do
          expect(response).to have_http_status(:not_found)
        end
      end
    end

    context "when logged in user is Admin" do
      context "when Admin wants to see record of an employee of his company" do
        before do
          employee.add_role :employee, company
          user.add_role :admin, company
          sign_in user
          send_request :get, internal_api_v1_user_previous_employments_path(employee, previous_employment_of_employee)
        end

        it "is successful" do
          expect(response).to have_http_status(:ok)
          expect(json_response["previous_employments"][0]["company_name"]
            ).to eq(previous_employment_of_employee.company_name)
          expect(json_response["previous_employments"][0]["role"]
            ).to eq(previous_employment_of_employee.role)
        end
      end
    end
  end

  context "when logged in user is an Employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      get "/internal_api/v1/user/#{user.id}/previous_employments/#{previous_employment_of_user.id}"
    end

    it "is forbidden" do
      expect(response).to have_http_status(:forbidden)
    end
  end
end
