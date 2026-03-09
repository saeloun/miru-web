# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::TimeoffEntry#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:leave) { create(:leave, company:, year: Date.current.year) }
  let!(:leave_type) do
    create(
      :leave_type, name: "Annual", leave:, allocation_period: "days",
      allocation_frequency: "per_month", allocation_value: 2)
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

    describe "#index" do
      it "returns timeoff entries with leave type" do
        timeoff_entry = create(:timeoff_entry, user:, leave_type:, duration: 480)

        send_request :get, internal_api_v1_timeoff_entries_path(user_id: user.id, year: Date.current.year),
          headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["timeoffEntries"].length).to eq(1)
        expect(json_response["timeoffEntries"][0]["leaveType"]["id"]).to eq(leave_type.id)
        expect(json_response["timeoffEntries"][0]["type"]).to eq("leave")
      end

      it "returns timeoff entries with custom leave" do
        timeoff_entry = create(:timeoff_entry, user:, leave_type: nil, custom_leave:, duration: 480)

        send_request :get, internal_api_v1_timeoff_entries_path(user_id: user.id, year: Date.current.year),
          headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["timeoffEntries"].length).to eq(1)
        expect(json_response["timeoffEntries"][0]["customLeave"]["id"]).to eq(custom_leave.id)
        expect(json_response["timeoffEntries"][0]["customLeave"]["name"]).to eq("Special Leave")
        expect(json_response["timeoffEntries"][0]["type"]).to eq("custom_leave")
      end

      it "returns leave balance including custom leaves" do
        send_request :get, internal_api_v1_timeoff_entries_path(user_id: user.id, year: Date.current.year),
          headers: auth_headers(user)

        expect(response).to have_http_status(:ok)

        leave_balance = json_response["leaveBalance"]
        custom_leave_balance = leave_balance.find { |lb| lb["type"] == "custom_leave" }

        expect(custom_leave_balance).not_to be_nil
        expect(custom_leave_balance["name"]).to eq("Special Leave")
      end

      it "returns both leave type and custom leave timeoff entries" do
        create(:timeoff_entry, user:, leave_type:, duration: 480)
        create(:timeoff_entry, user:, leave_type: nil, custom_leave:, duration: 240)

        send_request :get, internal_api_v1_timeoff_entries_path(user_id: user.id, year: Date.current.year),
          headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["timeoffEntries"].length).to eq(2)

        types = json_response["timeoffEntries"].map { |e| e["type"] }
        expect(types).to include("leave")
        expect(types).to include("custom_leave")
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    describe "#index" do
      it "returns own timeoff entries with custom leave" do
        timeoff_entry = create(:timeoff_entry, user:, leave_type: nil, custom_leave:, duration: 480)

        send_request :get, internal_api_v1_timeoff_entries_path(user_id: user.id, year: Date.current.year),
          headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["timeoffEntries"].length).to eq(1)
        expect(json_response["timeoffEntries"][0]["customLeave"]["name"]).to eq("Special Leave")
      end
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view timeoff entries" do
      send_request :get, internal_api_v1_timeoff_entries_path(user_id: user.id, year: Date.current.year)
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
