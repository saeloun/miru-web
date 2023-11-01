# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::TimesheetEntry::BulkActionController#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:project2) { create(:project, client:) }

  describe "#create" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "creates bulk timesheet entries" do
      params = {
        bulk_action: {
          timesheet_entry: [
            timesheet_entry_params[:time_entry],
            timesheet_entry_params[:time_entry2]
          ]
        },
        user_id: user.id
      }
      post(internal_api_v1_bulk_action_path, params:, headers: auth_headers(user))

      expect(user.timesheet_entries.size).to eq(2)
    end

    def timesheet_entry_params
      time_entry = {
        "project_id" => project.id, "duration" => 15, "work_date" => "2023-10-02T16:30:00.000+05:30", "note" => "Miru-Web Stand up",
        "bill_status" => "non_billable"
      }
      time_entry2 = {
        "project_id" => project2.id, "duration" => 35, "work_date" => "2023-10-02T18:30:00.000+05:30", "note" => "Documentor Stand up",
        "bill_status" => "unbilled"
      }
      { time_entry:, time_entry2: }
    end
  end
end
