# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::Reports::TimeEntriesController, type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:another_project) { create(:project, client:) }

  before do
    create(:employment, user:, company:)
    user.add_role(:admin, company)
    sign_in(user)
  end

  describe "GET #index" do
    before do
      create_list(:timesheet_entry, 5, user:, project:, work_date: Date.current)
      create_list(:timesheet_entry, 3, user:, project: another_project, work_date: Date.current - 1.day)
    end

    it "returns time entry reports" do
      get api_v1_reports_time_entries_path

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      expect(json).to have_key("reports")
      expect(json).to have_key("pagy")
      expect(json).to have_key("filterOptions")
      expect(json).to have_key("groupByTotalDuration")
    end

    it "includes user and project details in entries" do
      get api_v1_reports_time_entries_path

      json = JSON.parse(response.body)
      first_entry = json["reports"].first["entries"].first

      expect(first_entry).to have_key("user_name")
      expect(first_entry).to have_key("project_name")
      expect(first_entry).to have_key("client_name")
    end

    it "filters by date range" do
      get api_v1_reports_time_entries_path, params: {
        from: Date.current.strftime("%d/%m/%Y"),
        to: Date.current.strftime("%d/%m/%Y")
      }

      json = JSON.parse(response.body)
      all_entries = json["reports"].flat_map { |r| r["entries"] }

      expect(all_entries.size).to eq(5)
      expect(all_entries.all? { |e| Date.parse(e["work_date"]) == Date.current }).to be true
    end

    it "groups by client" do
      get api_v1_reports_time_entries_path, params: { group_by: "client" }

      json = JSON.parse(response.body)

      expect(json["groupByTotalDuration"]["groupBy"]).to eq("client")
      expect(json["reports"].first["label"]).to eq(client.name)
    end

    it "groups by project" do
      get api_v1_reports_time_entries_path, params: { group_by: "project" }

      json = JSON.parse(response.body)

      expect(json["groupByTotalDuration"]["groupBy"]).to eq("project")
    end

    it "groups by team member" do
      get api_v1_reports_time_entries_path, params: { group_by: "team_member" }

      json = JSON.parse(response.body)

      expect(json["groupByTotalDuration"]["groupBy"]).to eq("team_member")
    end

    it "calculates total durations correctly" do
      get api_v1_reports_time_entries_path, params: { group_by: "client" }

      json = JSON.parse(response.body)

      expect(json["groupByTotalDuration"]["groupedDurations"]).not_to be_empty

      # Verify the duration matches the sum of entries
      first_group = json["reports"].first
      expected_duration = first_group["entries"].sum { |e| e["duration"] }
      actual_duration = json["groupByTotalDuration"]["groupedDurations"][first_group["id"].to_s]

      expect(actual_duration).to eq(expected_duration)
    end

    it "paginates results" do
      create_list(:timesheet_entry, 60, user:, project:)

      get api_v1_reports_time_entries_path, params: { page: 2 }

      json = JSON.parse(response.body)

      expect(json["pagy"]["page"]).to eq(2)
      expect(json["pagy"]["pages"]).to be > 1
    end

    context "when user is not authorized" do
      before do
        user.remove_role(:admin, company)
        user.add_role(:employee, company)
      end

      it "returns unauthorized" do
        get api_v1_reports_time_entries_path

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET #download" do
    before do
      create_list(:timesheet_entry, 5, user:, project:)
    end

    it "downloads CSV format" do
      get download_api_v1_reports_time_entries_path(format: :csv)

      expect(response).to have_http_status(:ok)
      expect(response.headers["Content-Type"]).to include("text/csv")
      expect(response.headers["Content-Disposition"]).to include(".csv")
    end

    it "downloads PDF format" do
      get download_api_v1_reports_time_entries_path(format: :pdf)

      expect(response).to have_http_status(:ok)
      expect(response.headers["Content-Type"]).to include("application/pdf")
      expect(response.headers["Content-Disposition"]).to include(".pdf")
    end

    it "applies filters to download" do
      get download_api_v1_reports_time_entries_path(format: :csv), params: {
        from: Date.current.strftime("%d/%m/%Y"),
        to: Date.current.strftime("%d/%m/%Y")
      }

      expect(response).to have_http_status(:ok)
    end

    context "when user is not authorized" do
      before do
        user.remove_role(:admin, company)
        user.add_role(:employee, company)
      end

      it "returns unauthorized" do
        get download_api_v1_reports_time_entries_path(format: :csv)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
