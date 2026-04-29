# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimesheetEntry::BulkActionController#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project1) { create(:project, client:) }
  let(:project2) { create(:project, client:) }
  let!(:timesheet_entry1) { create(:timesheet_entry, user:, project: project1) }
  let!(:timesheet_entry2) { create(:timesheet_entry, user:, project: project1) }
  let!(:timesheet_entry3) { create(:timesheet_entry, user:, project: project1) }

  describe "#update" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      params = { ids: [timesheet_entry1.id, timesheet_entry2.id], project_id: project2.id }
      send_request :patch, api_v1_bulk_action_path, params:, headers: auth_headers(user)
    end

    it "updates the timesheet entry projects for passed ids" do
      expect(response).to be_successful
      expect(json_response["notice"]).to match("Timesheet updated")

      expected_project_id = TimesheetEntry.find([timesheet_entry1.id, timesheet_entry2.id]).pluck(:project_id).uniq
      expect(expected_project_id.first).to eq(project2.id)

      expect(TimesheetEntry.find(timesheet_entry3.id).project_id).to eq(project1.id)
    end

    it "rejects client users" do
      client_user = create(:user, current_workspace_id: company.id)
      create(:client_member, company:, user: client_user, client:)
      client_user.add_role :client, company

      sign_in client_user
      send_request :patch, api_v1_bulk_action_path,
        params: { ids: [timesheet_entry1.id], project_id: project2.id },
        headers: auth_headers(client_user)

      expect(response).to have_http_status(:forbidden)
    end

    it "rejects employees when selected entries are older than a week" do
      employee = create(:user, current_workspace_id: company.id)
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      employee.remove_role :owner, company
      employee.remove_role :admin, company
      create(:project_member, project: project1, user: employee)
      old_entry = create(
        :timesheet_entry,
        user: employee,
        project: project1,
        work_date: 8.days.ago.to_date
      )

      sign_out user
      send_request :patch, api_v1_bulk_action_path,
        params: { ids: [old_entry.id], project_id: project1.id },
        headers: auth_headers(employee)

      expect(response).to have_http_status(:forbidden)
    end

    it "rejects an empty selection" do
      send_request :patch, api_v1_bulk_action_path,
        params: { ids: [], project_id: project2.id },
        headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq("Failed to update timesheet entries")
    end

    it "does not update entries from another workspace" do
      other_company = create(:company)
      other_client = create(:client, company: other_company)
      other_project = create(:project, client: other_client)
      other_entry = create(:timesheet_entry, project: other_project)

      send_request :patch, api_v1_bulk_action_path,
        params: { ids: [other_entry.id], project_id: project2.id },
        headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response["error"]).to eq("Failed to update timesheet entries")
      expect(other_entry.reload.project_id).to eq(other_project.id)
    end

    it "does not move entries to projects from another workspace" do
      other_company = create(:company)
      other_client = create(:client, company: other_company)
      other_project = create(:project, client: other_client)

      send_request :patch, api_v1_bulk_action_path,
        params: { ids: [timesheet_entry3.id], project_id: other_project.id },
        headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
      expect(timesheet_entry3.reload.project_id).to eq(project1.id)
    end
  end
end
