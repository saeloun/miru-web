# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Mobile::TimesheetEntries", type: :request do
  let(:company) { create(:company, date_format: "YYYY-MM-DD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Saeloun") }
  let(:project) { create(:project, billable: true, client:, name: "Miru Mobile") }

  before do
    create(:employment, company:, user:)
    create(:project_member, project:, user:)
    user.add_role :employee, company
    sign_in user
  end

  it "reads mobile time entries for the signed-in employee" do
    entry = create(
      :timesheet_entry,
      user:,
      project:,
      duration: 45,
      note: "Mobile read",
      work_date: Date.current,
      bill_status: :unbilled
    )

    get "/api/v1/mobile/time-tracking",
      params: { from: Date.current.to_s, to: Date.current.to_s },
      headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    day_entries = json_response.dig("entries", Date.current.to_s)
    expect(day_entries.first).to include(
      "id" => entry.id,
      "duration" => 45,
      "note" => "Mobile read",
      "project" => "Miru Mobile",
      "client" => "Saeloun",
      "project_id" => project.id
    )
  end

  it "creates, updates, and deletes a time entry through mobile routes" do
    expect do
      post "/api/v1/mobile/timesheet_entries",
        params: {
          project_id: project.id,
          user_id: user.id,
          timesheet_entry: {
            bill_status: :unbilled,
            duration: 30,
            note: "Mobile create",
            work_date: Date.current
          }
        },
        headers: auth_headers(user)
    end.to change(TimesheetEntry, :count).by(1)

    entry = TimesheetEntry.last
    expect(response).to have_http_status(:ok)
    expect(json_response.dig("entry", "id")).to eq(entry.id)
    expect(entry).to have_attributes(
      duration: 30,
      note: "Mobile create",
      project_id: project.id,
      user_id: user.id
    )

    patch "/api/v1/mobile/timesheet_entries/#{entry.id}",
      params: {
        project_id: project.id,
        timesheet_entry: {
          bill_status: :non_billable,
          duration: 45,
          note: "Mobile update",
          work_date: Date.current
        }
      },
      headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response.dig("entry", "duration")).to eq(45.0)
    expect(entry.reload).to have_attributes(
      bill_status: "non_billable",
      duration: 45,
      note: "Mobile update"
    )

    delete "/api/v1/mobile/timesheet_entries/#{entry.id}", headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response["notice"]).to eq("Timesheet deleted")
    expect(entry.reload).to be_discarded
  end

  it "does not let an employee create another user's entry" do
    other_user = create(:user, current_workspace_id: company.id)
    create(:employment, company:, user: other_user)
    other_user.add_role :employee, company

    expect do
      post "/api/v1/mobile/timesheet_entries",
        params: {
          project_id: project.id,
          user_id: other_user.id,
          timesheet_entry: {
            duration: 30,
            note: "Invalid mobile create",
            work_date: Date.current
          }
        },
        headers: auth_headers(user)
    end.not_to change(TimesheetEntry, :count)

    expect(response).to have_http_status(:forbidden)
  end

  it "does not let an employee update another user's entry" do
    other_user = create(:user, current_workspace_id: company.id)
    create(:employment, company:, user: other_user)
    other_user.add_role :employee, company
    other_entry = create(:timesheet_entry, user: other_user, project:, work_date: Date.current)

    patch "/api/v1/mobile/timesheet_entries/#{other_entry.id}",
      params: {
        project_id: project.id,
        timesheet_entry: {
          duration: 60,
          note: "Invalid mobile update"
        }
      },
      headers: auth_headers(user)

    expect(response).to have_http_status(:forbidden)
    expect(other_entry.reload.note).not_to eq("Invalid mobile update")
  end
end
