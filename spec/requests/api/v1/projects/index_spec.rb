# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Projects index", type: :request do
  let(:company) { create(:company) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let!(:employment) { create(:employment, company:, user: employee) }
  let!(:assigned_client) { create(:client, company:, name: "Assigned Client") }
  let!(:other_client) { create(:client, company:, name: "Other Client") }
  let!(:assigned_project) { create(:project, client: assigned_client, name: "Assigned Project") }
  let!(:other_project) { create(:project, client: other_client, name: "Other Project") }

  before do
    employee.add_role :employee, company
    create(:project_member, user: employee, project: assigned_project)
  end

  it "returns only assigned projects and their clients for employees" do
    get "/api/v1/projects",
      params: {},
      headers: auth_headers(employee)

    expect(response).to have_http_status(:ok)
    body = response.parsed_body

    expect(body["projects"].pluck("name")).to eq(["Assigned Project"])
    expect(body["clients"].pluck("name")).to eq(["Assigned Client"])
  end
end
