# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PreviousEmployments#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:previous_employment_details) { attributes_for(:previous_employment) }

  context "when logged in user is Admin or Owner" do
    before do
      create(:employment, company:, user:)
    end

    context "when user is Owner" do
      context "when Owner wants to create his own record" do
        before do
          user.add_role :owner, company
          sign_in user
          send_request :post, api_v1_user_previous_employments_path(
            user_id: user.id,
            previous_employment: previous_employment_details
          ), headers: auth_headers(user)
        end

        it "is successful" do
          expect(response).to have_http_status(:created)
          expect(json_response["company_name"]).to eq(previous_employment_details[:company_name])
          expect(json_response["role"]).to eq(previous_employment_details[:role])
        end
      end

      context "when Owner wants to create record of an employee of his company" do
        before do
          create(:employment, company:, user: employee)
          user.add_role :owner, company
          sign_in user
          send_request :post, api_v1_user_previous_employments_path(
            user_id: employee.id,
            previous_employment: previous_employment_details
          ), headers: auth_headers(user)
        end

        it "is successful" do
          expect(response).to have_http_status(:created)
          expect(json_response["company_name"]).to eq(previous_employment_details[:company_name])
          expect(json_response["role"]).to eq(previous_employment_details[:role])
        end
      end

      context "when owner sends request to create record for user id which doesnt exist" do
          before do
            user.add_role :owner, company
            sign_in user
            send_request :post, api_v1_user_previous_employments_path(
              user_id: "abc",
              previous_employment: previous_employment_details
            ), headers: auth_headers(user)
          end

          it "is not found" do
            expect(response).to have_http_status(:not_found)
          end
        end
    end

    context "when user is Admin" do
      context "when admin wants to create his own record" do
        before do
          user.add_role :admin, company
          sign_in user
          send_request :post, api_v1_user_previous_employments_path(
            user_id: user.id,
            previous_employment: previous_employment_details
          ), headers: auth_headers(user)
        end

        it "is successful" do
          expect(response).to have_http_status(:created)
          expect(json_response["company_name"]).to eq(previous_employment_details[:company_name])
          expect(json_response["role"]).to eq(previous_employment_details[:role])
        end
      end

      context "when Admin wants to create record of an employee of his company" do
        before do
          create(:employment, company:, user: employee)
          user.add_role :admin, company
          sign_in user
          send_request :post, api_v1_user_previous_employments_path(
            user_id: employee.id,
            previous_employment: previous_employment_details
          ), headers: auth_headers(user)
        end

        it "is successful" do
          expect(response).to have_http_status(:created)
          expect(json_response["company_name"]).to eq(previous_employment_details[:company_name])
          expect(json_response["role"]).to eq(previous_employment_details[:role])
        end
      end

      context "when admin sends request to create record for user id which doesnt exist" do
          before do
            user.add_role :admin, company
            sign_in user
            send_request :post, api_v1_user_previous_employments_path(
              user_id: "abc",
              previous_employment: previous_employment_details
            ), headers: auth_headers(user)
          end

          it "is not found" do
            expect(response).to have_http_status(:not_found)
          end
        end
    end
  end

  context "when logged in user is an Employee" do
    context "when Employee wants to create his own Previous Employments details" do
      before do
        create(:employment, company:, user:)
        user.add_role :employee, company
        sign_in user
        send_request :post, api_v1_user_previous_employments_path(
          user_id: user.id,
          previous_employment: previous_employment_details
        ), headers: auth_headers(user)
      end

      it "is successful" do
        expect(response).to have_http_status(:created)
        expect(json_response["company_name"]).to eq(previous_employment_details[:company_name])
        expect(json_response["role"]).to eq(previous_employment_details[:role])
      end
    end

    context "when Employee wants to create someone else's record" do
      before do
        create(:employment, company:, user:)
        create(:employment, company:, user: employee)
        user.add_role :employee, company
        sign_in user
        send_request :post, api_v1_user_previous_employments_path(
          user_id: employee.id,
          previous_employment: previous_employment_details
        ), headers: auth_headers(user)
      end

      it "is forbidden" do
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
