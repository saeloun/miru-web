# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PreviousEmployments#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let!(:previous_employment_of_employee) { create(:previous_employment, user: employee) }
  let!(:previous_employment_of_user) { create(:previous_employment, user:) }

  context "when logged in user is Admin or Owner" do
    before do
      create(:employment, company:, user:)
    end

    context "when user is owner" do
      context "when owner wants to check his own details" do
        before do
          user.add_role :owner, company
          sign_in user
          send_request :get, internal_api_v1_user_previous_employments_path(user)
        end

        it "is successful" do
          expect(response).to have_http_status(:ok)
          expect(json_response["previous_employments"][0]["company_name"]
            ).to eq(previous_employment_of_user.company_name)
          expect(json_response["previous_employments"][0]["role"]
            ).to eq(previous_employment_of_user.role)
        end
      end

      context "when owner and wants to check record of an employee" do
        context "when owner sends valid request" do
          before do
            create(:employment, company:, user: employee)
            user.add_role :owner, company
            sign_in user
            send_request :get, internal_api_v1_user_previous_employments_path(employee)
          end

          it "is successful" do
            expect(response).to have_http_status(:ok)
            expect(json_response["previous_employments"][0]["company_name"]
              ).to eq(previous_employment_of_employee.company_name)
            expect(json_response["previous_employments"][0]["role"]
              ).to eq(previous_employment_of_employee.role)
          end
        end

        context "when owner sends request for user id which doesnt exist" do
          before do
            user.add_role :owner, company
            sign_in user
            send_request :get, internal_api_v1_user_previous_employments_path("abc")
          end

          it "is forbidden" do
            expect(response).to have_http_status(:not_found)
          end
        end
      end
    end

    context "when user is admin" do
      context "when admin wants to check his own details" do
        before do
          user.add_role :owner, company
          sign_in user
          send_request :get, internal_api_v1_user_previous_employments_path(user)
        end

        it "is successful" do
          expect(response).to have_http_status(:ok)
          expect(json_response["previous_employments"][0]["company_name"]
            ).to eq(previous_employment_of_user.company_name)
          expect(json_response["previous_employments"][0]["role"]
            ).to eq(previous_employment_of_user.role)
        end
      end

      context "when user is admin and wants to check record of an employee" do
        context "when admin sends valid request" do
          before do
            create(:employment, company:, user: employee)
            create(:employment, company:, user:)
            user.add_role :admin, company
            sign_in user
            send_request :get, internal_api_v1_user_previous_employments_path(employee)
          end

          it "is successful" do
            expect(response).to have_http_status(:ok)
            expect(json_response["previous_employments"][0]["company_name"]
              ).to eq(previous_employment_of_employee.company_name)
            expect(json_response["previous_employments"][0]["role"]
              ).to eq(previous_employment_of_employee.role)
          end
        end

        context "when admin sends request for user id which doesnt exist" do
          before do
            user.add_role :admin, company
            sign_in user
            send_request :get, internal_api_v1_user_previous_employments_path("abc")
          end

          it "is forbidden" do
            expect(response).to have_http_status(:not_found)
          end
        end
      end
    end
  end

  context "when user is Employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_user_previous_employments_path(user)
    end

    it "is successful" do
      expect(response).to have_http_status(:forbidden)
    end
  end
end
