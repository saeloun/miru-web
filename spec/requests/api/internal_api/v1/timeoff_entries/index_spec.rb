# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimeoffEntry#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:leave) { create(:leave, company:, year: Date.current.year) }
  let!(:leave_type) do
    create(
      :leave_type, name: "Annual", leave:, allocation_period: "days",
      allocation_frequency: "per_month", allocation_value: 2
    )
  end
  let!(:custom_leave) { create(:custom_leave, leave:, name: "Special Leave", allocation_value: 5) }

  before do
    create(:custom_leave_user, custom_leave:, user:)
  end

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "returns timeoff entries with leave type" do
      create(:timeoff_entry, user:, leave_type:, duration: 480)

      send_request :get, api_v1_timeoff_entries_path(user_id: user.id, year: Date.current.year),
        headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["timeoffEntries"].length).to eq(1)
      expect(json_response["timeoffEntries"][0]["leaveType"]["id"]).to eq(leave_type.id)
      expect(json_response["timeoffEntries"][0]["type"]).to eq("leave")
    end

    it "returns leave balance data" do
      send_request :get, api_v1_timeoff_entries_path(user_id: user.id, year: Date.current.year),
        headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["leaveBalance"]).to be_present
    end

    it "returns custom leave entries without raising an error" do
      create(:timeoff_entry, user:, leave_type: nil, custom_leave:, duration: 240)

      send_request :get, api_v1_timeoff_entries_path(user_id: user.id, year: Date.current.year),
        headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["timeoffEntries"].length).to eq(1)
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "returns own timeoff entries" do
      create(:timeoff_entry, user:, leave_type:, duration: 480)

      send_request :get, api_v1_timeoff_entries_path(user_id: user.id, year: Date.current.year),
        headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["timeoffEntries"].length).to eq(1)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view timeoff entries" do
      send_request :get, api_v1_timeoff_entries_path(user_id: user.id, year: Date.current.year)

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
