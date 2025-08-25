# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimesheetEntry::BulkActionController#destroy", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let!(:timesheet_entry1) { create(:timesheet_entry, user:, project:) }
  let!(:timesheet_entry2) { create(:timesheet_entry, user:, project:) }
  let!(:timesheet_entry3) { create(:timesheet_entry, user:, project:) }

  describe "#destroy" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      params = { source: { ids: [timesheet_entry1.id, timesheet_entry2.id] } }
      send_request :delete, api_v1_bulk_action_path, params:, headers: auth_headers(user)
    end

    it "deletes the timesheet entries for the selected ids" do
      expect(response).to be_successful
      expect(json_response["notice"]).to match("Timesheet deleted")
      expect(TimesheetEntry.where(id: [timesheet_entry1.id, timesheet_entry2.id]).kept.count).to eq(0)
      expect(TimesheetEntry.where(id: timesheet_entry3.id).kept.count).to eq(1)
    end
  end
end
