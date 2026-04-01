# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimesheetEntry#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let!(:timesheet_entry) do
    create(
      :timesheet_entry,
      user:,
      project:,
      work_date: Date.current - 180.days,
      note: "Old entry still viewable"
    )
  end

  before do
    create(:employment, company:, user:)
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
end
