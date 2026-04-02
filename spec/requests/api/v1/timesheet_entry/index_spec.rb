# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimesheetEntry#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:other_user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:leave) { create(:leave, company:, year: Date.current.year) }
  let!(:leave_type) { create(:leave_type, leave:, name: "PTO") }
  let!(:timesheet_entry) do
    create(
      :timesheet_entry,
      user:,
      project:,
      work_date: Date.current - 180.days,
      note: "Old entry still viewable"
    )
  end
  let!(:timeoff_entry) do
    create(
      :timeoff_entry,
      user:,
      leave_type:,
      leave_date: Date.current - 180.days,
      duration: 480,
      note: "PTO applied"
    )
  end

  before do
    create(:employment, company:, user:)
    create(:employment, company:, user: other_user)
    user.add_role :admin, company
    sign_in user
  end

  it "returns older entries without raising when proof_url is blank" do
    send_request :get, api_v1_timesheet_entry_index_path, params: {
      from: (Date.current - 365.days).iso8601,
      to: Date.current.iso8601
    }, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    entry = json_response.dig("entries", timesheet_entry.work_date.iso8601).first
    expect(entry["id"]).to eq(timesheet_entry.id)
    expect(entry["proof_url"]).to be_nil
    expect(entry["note"]).to eq("Old entry still viewable")
  end

  it "includes timeoff entries and leave metadata in the response" do
    send_request :get, api_v1_timesheet_entry_index_path, params: {
      from: (Date.current - 365.days).iso8601,
      to: Date.current.iso8601,
      year: Date.current.year
    }, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    leave_entry = json_response.fetch("entries").values.flatten.find do |entry|
      entry["type"] == "leave" && entry["leave_type_id"] == leave_type.id
    end

    expect(leave_entry["type"]).to eq("leave")
    expect(leave_entry["id"]).to eq(timeoff_entry.id)
    expect(leave_entry["leave_type_id"]).to eq(leave_type.id)
    expect(leave_entry["note"]).to eq("PTO applied")
    expect(json_response["leave_types"].pluck("id")).to include(leave_type.id)
  end

  it "returns leave entries for day-first date params used by week navigation" do
    target_date = Date.current.beginning_of_week - 7.days
    weekly_timeoff_entry = create(
      :timeoff_entry,
      user:,
      leave_type:,
      leave_date: target_date,
      duration: 480,
      note: "Week navigation PTO"
    )

    send_request :get, api_v1_timesheet_entry_index_path, params: {
      from: target_date.beginning_of_week.strftime("%d-%m-%Y"),
      to: target_date.end_of_week.strftime("%d-%m-%Y"),
      year: target_date.year
    }, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    leave_entry = json_response.fetch("entries").values.flatten.find do |entry|
      entry["id"] == weekly_timeoff_entry.id
    end

    expect(leave_entry["type"]).to eq("leave")
    expect(leave_entry["leave_type_id"]).to eq(leave_type.id)
  end

  it "ignores another user's user_id for employees" do
    employee_user = create(:user, current_workspace_id: company.id)
    create(:employment, company:, user: employee_user)
    employee_user.add_role :employee, company
    own_entry = create(
      :timesheet_entry,
      user: employee_user,
      project:,
      work_date: Date.current - 180.days,
      note: "Own employee entry"
    )
    other_entry = create(
      :timesheet_entry,
      user: other_user,
      project:,
      work_date: Date.current - 180.days,
      note: "Other user entry"
    )

    sign_out user
    sign_in employee_user

    send_request :get, api_v1_timesheet_entry_index_path, params: {
      from: (Date.current - 365.days).iso8601,
      to: Date.current.iso8601,
      user_id: other_user.id
    }, headers: auth_headers(employee_user)

    expect(response).to have_http_status(:ok)
    flattened_entries = json_response.fetch("entries").values.flatten
    expect(flattened_entries.pluck("id")).not_to include(other_entry.id)
    expect(flattened_entries.pluck("id")).to include(own_entry.id)
  end
end
