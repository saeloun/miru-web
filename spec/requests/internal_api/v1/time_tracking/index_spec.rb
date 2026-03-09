# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::TimeTracking#index", type: :request do
  let(:company1) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company1.id) }
  let!(:client1) { create(:client, company: company1, name: "ABC") }
  let!(:client2) { create(:client, company: company1, name: "MNC") }
  let!(:client3) { create(:client, company: company2) }
  let!(:project1) { create(:project, client: client1) }
  let!(:project2) { create(:project, client: client1) }
  let!(:project3) { create(:project, client: client2) }
  let!(:project4) { create(:project, client: client3) }

  before do
    create(:project_member, user:, project: project1)
    create(:project_member, user:, project: project4)
  end

  context "when user is an admin" do
    before do
      create(:employment, company: company1, user:)
      user.add_role :admin, company1
      sign_in user
      send_request :get, internal_api_v1_time_tracking_index_path, headers: auth_headers(user)
    end

    it "returns success" do
      expect(response).to have_http_status(:ok)
    end

    it "returns all clients of the company" do
      expect(json_response["clients"].pluck("id")).to eq([client1.id, client2.id])
    end

    it "returns all projects of all clients of the company" do
      expected_response = {
        client1.name => [project1.id, project2.id],
        client2.name => [project3.id]
      }
      actual_response = json_response["projects"].transform_values { |projects|
  projects.pluck("id")
}
      expect(actual_response).to eq(expected_response)
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company: company1, user:)
      user.add_role :employee, company1
      sign_in user
      send_request :get, internal_api_v1_time_tracking_index_path, headers: auth_headers(user)
    end

    it "returns success" do
      expect(response).to have_http_status(:ok)
    end

    it "returns only those clients of projects to which employee is added" do
      expect(json_response["clients"].pluck("id")).to eq([client1.id])
    end

    it "returns only those projects to which employee is added" do
      expected_response = { client1.name => [project1.id] }
      actual_response = json_response["projects"].transform_values { |projects|
  projects.pluck("id")
}
      expect(actual_response).to eq(expected_response)
    end
  end

  context "when user has custom leaves assigned" do
    let!(:leave) { create(:leave, company: company1, year: Date.current.year) }
    let!(:leave_type) do
      create(
        :leave_type, leave:, name: "Annual", allocation_value: 2, allocation_period: :days,
        allocation_frequency: :per_month)
    end
    let!(:custom_leave) { create(:custom_leave, leave:, name: "Special Leave", allocation_value: 5) }

    before do
      create(:custom_leave_user, custom_leave:, user:)
      create(:employment, company: company1, user:)
      user.add_role :employee, company1
      sign_in user
      send_request :get, internal_api_v1_time_tracking_index_path(year: Date.current.year),
        headers: auth_headers(user)
    end

    it "returns both regular leave types and custom leaves" do
      leave_type_names = json_response["leave_types"].pluck("name")
      expect(leave_type_names).to include("Annual")
      expect(leave_type_names).to include("Special Leave")
    end

    it "returns custom leaves with type field set to custom_leave" do
      custom_leave_response = json_response["leave_types"].find { |lt| lt["name"] == "Special Leave" }
      expect(custom_leave_response["type"]).to eq("custom_leave")
      expect(custom_leave_response["id"]).to eq("custom_#{custom_leave.id}")
      expect(custom_leave_response["custom_leave_id"]).to eq(custom_leave.id)
    end

    it "returns regular leave types with type field set to leave_type" do
      leave_type_response = json_response["leave_types"].find { |lt| lt["name"] == "Annual" }
      expect(leave_type_response["type"]).to eq("leave_type")
      expect(leave_type_response["id"]).to eq(leave_type.id)
    end
  end
end
