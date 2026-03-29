# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::LeaveTypes", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:leave) { create(:leave, company:, year: 2024) }

  describe "POST #create" do
    context "when user is an admin" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user
      end

      it "creates a new leave type" do
        send_request :post, api_v1_leave_leave_types_path(leave),
          params: {
            leave_type: {
              name: "Sick Leave",
              color: "chart_blue",
              icon: "medicine",
              allocation_value: 10,
              allocation_period: "days",
              allocation_frequency: "per_year",
              carry_forward_days: 0
            }
          },
          headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["notice"]).to eq("Added leave type successfully")
      end
    end

    context "when user is an employee" do
      before do
        create(:employment, company:, user:)
        user.add_role :employee, company
        sign_in user
      end

      it "is not permitted" do
        send_request :post, api_v1_leave_leave_types_path(leave),
          params: {
            leave_type: {
              name: "Sick Leave",
              color: "chart_blue",
              icon: "medicine",
              allocation_value: 10,
              allocation_period: "days",
              allocation_frequency: "per_year",
              carry_forward_days: 0
            }
          },
          headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        send_request :post, api_v1_leave_leave_types_path(leave),
          params: {
            leave_type: {
              name: "Sick Leave",
              color: "chart_blue",
              icon: "medicine",
              allocation_value: 10,
              allocation_period: "days",
              allocation_frequency: "per_year",
              carry_forward_days: 0
            }
          }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
