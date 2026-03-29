# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::LeaveTypes#update", type: :request do
  let(:company) { create(:company) }
  let(:leave) { create(:leave, company:, year: 2024) }
  let(:leave_type) do
    create(
      :leave_type,
      leave:,
      name: "Annual",
      allocation_value: 2,
      allocation_period: "days",
      allocation_frequency: "per_year",
      carry_forward_days: 0
    )
  end
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: admin)
    admin.add_role :admin, company

    create(:employment, company:, user: employee)
    employee.add_role :employee, company
  end

  context "when user is an admin" do
    before do
      sign_in admin
    end

    it "updates leave type" do
      send_request :patch,
        api_v1_leave_leave_type_path(leave, leave_type),
        params: {
          leave_type: {
            name: "Sick",
            allocation_value: 12,
            color: "chart_blue",
            icon: "medicine",
            allocation_period: "days",
            allocation_frequency: "per_year",
            carry_forward_days: 2
          }
        },
        headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq("Updated leave type successfully")
      expect(leave_type.reload.name).to eq("Sick")
      expect(leave_type.allocation_value).to eq(12)
    end
  end

  context "when user is an employee" do
    before do
      sign_in employee
      send_request :patch,
        api_v1_leave_leave_type_path(leave, leave_type),
        params: { leave_type: { name: "Sick" } },
        headers: auth_headers(employee)
    end

    it "is not permitted" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      send_request :patch,
        api_v1_leave_leave_type_path(leave, leave_type),
        params: { leave_type: { name: "Sick" } }

      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
