# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Leaves#update", type: :request do
  let(:company) { create(:company) }
  let(:leave) { create(:leave, company:, year: 2024) }
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

    it "updates leave" do
      send_request :patch,
        api_v1_leave_path(leave),
        params: { leave: { year: 2025 } },
        headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq("Leave updated successfully")
      expect(leave.reload.year).to eq(2025)
    end
  end

  context "when user is an employee" do
    before do
      sign_in employee
      send_request :patch,
        api_v1_leave_path(leave),
        params: { leave: { year: 2025 } },
        headers: auth_headers(employee)
    end

    it "is not permitted" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      send_request :patch, api_v1_leave_path(leave), params: { leave: { year: 2025 } }

      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
