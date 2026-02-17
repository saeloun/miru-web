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
  end
end
