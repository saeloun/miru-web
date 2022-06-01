# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Reports#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:client2) { create(:client, company_id: company.id) }
  let(:project2) { create(:project, client_id: client2.id) }
  let(:client3) { create(:client, company_id: company.id) }
  let(:project3) { create(:project, client_id: client3.id) }
  let(:last_month_start_date) { 1.month.ago.beginning_of_month }
  let(:this_week_start_date) { 0.weeks.ago.beginning_of_week }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when reports page's request is made without any filters" do
      before do
        @timesheet_entry1 = create(:timesheet_entry, project:)
        TimesheetEntry.search_index.refresh
        get internal_api_v1_reports_path
      end

      it "returns the time entry report" do
        expect(response).to have_http_status(:ok)
        expect(json_response["entries"].size).to eq(1)
        expect(json_response["entries"].first["id"]).to eq(@timesheet_entry1.id)
        filter_options = {
          clients: [{ "label": client.name, "value": client.id }],
          teamMembers: [{ "label": user.full_name, "value": user.id }]
        }
        expect(json_response["filterOptions"]).to eq(JSON.parse(filter_options.to_json))
      end
    end

    context "when reports page's request is made with date range filter" do
      before do
        @timesheet_entry1 = create(:timesheet_entry, project:, work_date: last_month_start_date)
        @timesheet_entry2 = create(:timesheet_entry, project:, work_date: this_week_start_date)
        @timesheet_entry3 = create(:timesheet_entry, project:, work_date: this_week_start_date)
        TimesheetEntry.search_index.refresh
      end

      it "returns the time entry reports in given date range" do
        send_request :get, internal_api_v1_reports_path, params: {
          date_range: "this_week"
        }
        expect(response).to have_http_status(:ok)
        timesheet_ids_in_response = json_response["entries"].pluck("id")
        expect(json_response["entries"].size).to eq(2)
        expect(timesheet_ids_in_response).to include(@timesheet_entry2.id, @timesheet_entry3.id)
        expect(timesheet_ids_in_response).not_to include(@timesheet_entry1.id)
        expect(json_response["filterOptions"]).to eq(JSON.parse({ clients: [], teamMembers: [] }.to_json))
      end
    end

    context "when reports page's request is made with bill status filter" do
      before do
        @timesheet_entry1 = create(:timesheet_entry, project:)
        @timesheet_entry2 = create(:timesheet_entry, project:, bill_status: "unbilled")
        @timesheet_entry3 = create(:timesheet_entry, project:)
        TimesheetEntry.search_index.refresh
      end

      it "returns the time entry reports with given single status value" do
        send_request :get, internal_api_v1_reports_path, params: {
          status: ["unbilled"]
        }
        expect(response).to have_http_status(:ok)
        timesheet_ids_in_response = json_response["entries"].pluck("id")
        expect(json_response["entries"].size).to eq(1)
        expect(timesheet_ids_in_response).to include(@timesheet_entry2.id)
      end

      it "returns the time entry reports with given multiple status values" do
        send_request :get, internal_api_v1_reports_path, params: {
          status: ["unbilled", "non_billable"]
        }
        expect(response).to have_http_status(:ok)
        timesheet_ids_in_response = json_response["entries"].pluck("id")
        expect(json_response["entries"].size).to eq(3)
        expect(timesheet_ids_in_response).to include(@timesheet_entry1.id, @timesheet_entry2.id, @timesheet_entry3.id)
      end
    end

    context "when reports page's request is made with clients filter" do
      before do
        @timesheet_entry1 = create(:timesheet_entry, project:)
        @timesheet_entry2 = create(:timesheet_entry, project:)
        @timesheet_entry3 = create(:timesheet_entry, project: project2)
        @timesheet_entry4 = create(:timesheet_entry, project: project3)
        TimesheetEntry.search_index.refresh
      end

      it "returns the time entry reports with given single client value" do
        send_request :get, internal_api_v1_reports_path, params: {
          client: [client.id]
        }
        get "/internal_api/v1/reports?client[]=#{client.id}"
        expect(response).to have_http_status(:ok)
        timesheet_ids_in_response = json_response["entries"].pluck("id")
        expect(json_response["entries"].size).to eq(2)
        expect(timesheet_ids_in_response).to include(@timesheet_entry1.id, @timesheet_entry2.id)
      end

      it "returns the time entry reports with given multiple client values" do
        send_request :get, internal_api_v1_reports_path, params: {
          client: [client.id, client2.id]
        }
        expect(response).to have_http_status(:ok)
        timesheet_ids_in_response = json_response["entries"].pluck("id")
        expect(json_response["entries"].size).to eq(3)
        expect(timesheet_ids_in_response).to include(@timesheet_entry1.id, @timesheet_entry2.id, @timesheet_entry3.id)
      end
    end

    context "when reports page's request is made with team members filter" do
      before do
        @user1 = create(:user)
        @user2 = create(:user)
        @user3 = create(:user)
        @timesheet_entry1 = create(:timesheet_entry, user: @user1, project:)
        @timesheet_entry2 = create(:timesheet_entry, user: @user1, project:)
        @timesheet_entry3 = create(:timesheet_entry, user: @user2, project:)
        @timesheet_entry4 = create(:timesheet_entry, user: @user3, project:)
        TimesheetEntry.search_index.refresh
      end

      it "returns the time entry reports with given single team member value" do
        send_request :get, internal_api_v1_reports_path, params: {
          team_member: [@user1.id]
        }
        expect(response).to have_http_status(:ok)
        timesheet_ids_in_response = json_response["entries"].pluck("id")
        expect(json_response["entries"].size).to eq(2)
        expect(timesheet_ids_in_response).to include(@timesheet_entry1.id, @timesheet_entry2.id)
      end

      it "returns the time entry reports with given multiple team members values" do
        send_request :get, internal_api_v1_reports_path, params: {
          team_member: [@user1.id, @user2.id]
        }
        expect(response).to have_http_status(:ok)
        timesheet_ids_in_response = json_response["entries"].pluck("id")
        expect(json_response["entries"].size).to eq(3)
        expect(timesheet_ids_in_response).to include(@timesheet_entry1.id, @timesheet_entry2.id, @timesheet_entry3.id)
      end
    end

    context "when reports page's request is made with combination of filters" do
      before do
        @user1 = create(:user)
        @user2 = create(:user)
        @last_month_end_date = 1.month.ago.end_of_month
        @timesheet_entry1 = create(
          :timesheet_entry,
          work_date: last_month_start_date,
          project:,
          user: @user1,
          bill_status: "unbilled")
        @timesheet_entry2 = create(
          :timesheet_entry,
          project:,
          work_date: @last_month_end_date,
          user: @user1,
          bill_status: "unbilled")
        @timesheet_entry3 = create(
          :timesheet_entry,
          project:,
          work_date: @last_month_end_date,
          user: @user1)
        @timesheet_entry4 = create(
          :timesheet_entry,
          project:,
          work_date: @last_month_end_date,
          user: @user2,
          bill_status: "unbilled")
        @timesheet_entry5 = create(
          :timesheet_entry,
          project: project2,
          work_date: @last_month_end_date,
          user: @user1,
          bill_status: "unbilled")
        @timesheet_entry6 = create(
          :timesheet_entry,
          project:,
          work_date: Date.today,
          user: @user1,
          bill_status: "unbilled")
        TimesheetEntry.search_index.refresh
      end

      it "returns the time entry reports with given filter values" do
        send_request :get, internal_api_v1_reports_path, params: {
          date_range: "last_month",
          status: ["unbilled"],
          team_member: [@user1.id],
          client: [client.id]
        }
        expect(response).to have_http_status(:ok)
        timesheet_ids_in_response = json_response["entries"].pluck("id")
        expect(json_response["entries"].size).to eq(3)
        expect(timesheet_ids_in_response).to include(@timesheet_entry1.id, @timesheet_entry2.id)
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_reports_path
    end

    it "is not permitted to view time entry report" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view time entry report" do
      send_request :get, internal_api_v1_reports_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
