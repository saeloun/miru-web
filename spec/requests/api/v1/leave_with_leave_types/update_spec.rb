# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::LeaveWithLeaveTypes#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "updates leave with leave types" do
      patch api_v1_update_leave_with_leave_types_path(year: 2024),
        params: {
          leave_with_leave_type: {
            add_leave_types: [
              {
                name: "Sick Leave",
                color: "chart_blue",
                icon: "medicine",
                allocation_value: 10,
                allocation_period: "days",
                allocation_frequency: "per_year",
                carry_forward_days: 0
              }
            ],
            updated_leave_types: [],
            removed_leave_type_ids: []
          }
        },
        headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq("Leaves updated successfully")
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "is not permitted" do
      patch api_v1_update_leave_with_leave_types_path(year: 2024),
        params: {
          leave_with_leave_type: {
            add_leave_types: [],
            updated_leave_types: [],
            removed_leave_type_ids: []
          }
        },
        headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      patch api_v1_update_leave_with_leave_types_path(year: 2024),
        params: {
          leave_with_leave_type: {
            add_leave_types: [],
            updated_leave_types: [],
            removed_leave_type_ids: []
          }
        }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
