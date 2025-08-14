# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Reports::TimeEntryController#download", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:project) { (create :project, client: create(:client, company:)) }
  let!(:timesheet_entry) { create(:timesheet_entry, project:, user: admin) }
  let(:type) { "csv" }

  before do
    create(:employment, user: admin, company:)
    create(:employment, user: employee, company:)
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
  end

  context "when user is an admin or owner" do
    before { sign_in admin }

    context "when CSV file requested" do
      let(:csv_headers) do
        "Project,Client,Note,Team Member,Date,Hours Logged"
      end
      let(:csv_data) do
        "#{timesheet_entry.project_name}," \
          "#{timesheet_entry.client_name}," \
          "#{timesheet_entry.note}," \
          "#{timesheet_entry.user_full_name}," \
          "#{timesheet_entry.formatted_work_date}," \
          "#{timesheet_entry.formatted_duration}"
      end

      it "returns CSV data in response" do
        send_request :get, "/internal_api/v1/reports/time_entries/download.#{type}", headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        expect(response.body).to include(csv_headers)
        expect(response.body).to include(csv_data)
      end
    end

    context "when pdf file requested" do
      let(:type) { "pdf" }

      it "generates PDF and send in response" do
        send_request :get, "/internal_api/v1/reports/time_entries/download.#{type}", headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        expect(response.body).to include("PDF")
      end
    end
  end

  context "when user is an employee" do
    before { sign_in employee }

    it "returns 403 status" do
      send_request :get, "/internal_api/v1/reports/time_entries/download.#{type}", headers: auth_headers(employee)
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq "You are not authorized to perform this action."
    end
  end

  context "when user is a book keeper" do
    before { sign_in book_keeper }

    context "when CSV file requested" do
      let(:csv_headers) do
        "Project,Client,Note,Team Member,Date,Hours Logged"
      end
      let(:csv_data) do
        "#{timesheet_entry.project_name}," \
          "#{timesheet_entry.client_name}," \
          "#{timesheet_entry.note}," \
          "#{timesheet_entry.user_full_name}," \
          "#{timesheet_entry.formatted_work_date}," \
          "#{timesheet_entry.formatted_duration}"
      end

      it "returns CSV data in response" do
        send_request :get, "/internal_api/v1/reports/time_entries/download.#{type}", headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        expect(response.body).to include(csv_headers)
        expect(response.body).to include(csv_data)
      end
    end

    context "when pdf file requested" do
      let(:type) { "pdf" }

      it "generates PDF and send in response" do
        send_request :get, "/internal_api/v1/reports/time_entries/download.#{type}", headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        expect(response.body).to include("PDF")
      end
    end
  end
end
