# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PreviousEmployments#show", type: :request do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:employee2) { create(:user, current_workspace_id: company2.id) }
  let(:previous_employment_of_employee) { create(:previous_employment, user: employee) }
  let(:previous_employment_of_employee2) { create(:previous_employment, user: employee2) }
  let(:previous_employment_of_user) { create(:previous_employment, user:) }

  context "when record belongs to employee of the current workspace" do
    before do
      create(:employment, company:, user:)
    end

    context "when logged in user is Owner" do
      context "when Owner wants to see his own record" do
        before do
          user.add_role :owner, company
          sign_in user
          send_request :get, api_v1_user_previous_employment_path(user, previous_employment_of_user),
            headers: auth_headers(user)
        end

        it "is successful" do
          expect(response).to have_http_status(:ok)
          expect(json_response["company_name"]).to eq(previous_employment_of_user["company_name"])
          expect(json_response["role"]).to eq(previous_employment_of_user["role"])
        end
      end

      context "when Owner wants to see record of an employee" do
        before do
          employee.add_role :employee, company
          create(:employment, company:, user: employee)
          user.add_role :owner, company
          sign_in user
          send_request :get, api_v1_user_previous_employment_path(employee, previous_employment_of_employee),
            headers: auth_headers(user)
        end

        it "is successful" do
          expect(response).to have_http_status(:ok)
          expect(json_response["company_name"]).to eq(previous_employment_of_employee["company_name"])
          expect(json_response["role"]).to eq(previous_employment_of_employee["role"])
        end
      end

      context "when owner sends request to see record for user id which doesnt exist" do
        before do
          create(:employment, company:, user:)
          user.add_role :owner, company
          sign_in user
          send_request :get, api_v1_user_previous_employment_path("abc", previous_employment_of_employee),
            headers: auth_headers(user)
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
          send_request :get, api_v1_user_previous_employment_path(user, previous_employment_of_employee),
            headers: auth_headers(user)
        end

        it "is not found" do
          expect(response).to have_http_status(:not_found)
        end
      end
    end

    context "when logged in user is admin" do
      context "when Admin wants to see record of an employee" do
        before do
          employee.add_role :employee, company
          create(:employment, company:, user: employee)
          user.add_role :admin, company
          sign_in user
          send_request :get, api_v1_user_previous_employment_path(employee, previous_employment_of_employee),
            headers: auth_headers(user)
        end

        it "is successful" do
          expect(response).to have_http_status(:ok)
          expect(json_response["company_name"]).to eq(previous_employment_of_employee["company_name"])
          expect(json_response["role"]).to eq(previous_employment_of_employee["role"])
        end
      end
    end

    context "when logged in user is employee" do
      context "when employee wants to see his own record" do
        before do
          user.add_role :employee, company
          create(:employment, company:, user:)
          user.add_role :employee, company
          sign_in user
          send_request :get, api_v1_user_previous_employment_path(user, previous_employment_of_user),
            headers: auth_headers(user)
        end

        it "is successful" do
          expect(response).to have_http_status(:ok)
          expect(json_response["company_name"]).to eq(previous_employment_of_user["company_name"])
          expect(json_response["role"]).to eq(previous_employment_of_user["role"])
        end
      end

      context "when employee wants to see someone else's record" do
        before do
          user.add_role :employee, company
          create(:employment, company:, user:)
          create(:employment, company:, user: employee)
          user.add_role :employee, company
          employee.add_role :employee, company
          sign_in user
          send_request :get, api_v1_user_previous_employment_path(user, previous_employment_of_employee),
            headers: auth_headers(user)
        end

        it "is not found" do
          expect(response).to have_http_status(:not_found)
        end
      end
    end
  end

  context "when logged in user wants to see details of an Employee of different workspace" do
    before do
      create(:previous_employment, user: employee2)
      create(:employment, company: company2, user: employee2)
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request :get, api_v1_user_previous_employment_path(user, previous_employment_of_employee2),
        headers: auth_headers(user)
    end

    it "is not found" do
      expect(response).to have_http_status(:not_found)
    end
  end
end
