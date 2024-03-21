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
  let!(:holiday) { create(:holiday, year: Date.current.year, company: company1) }
  let(:national_holiday) { create(:holiday_info, date: Date.current, category: "national", holiday:) }
  let(:optional_holiday) { create(:holiday_info, date: Date.current + 2.days, category: "optional", holiday:) }

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
end
