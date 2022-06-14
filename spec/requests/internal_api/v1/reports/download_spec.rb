# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::ReportsController#download", type: :request do
  subject { get "/internal_api/v1/reports/download.#{type}" }

  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:project) { (create :project, client: create(:client, company:)) }
  let!(:timesheet_entry) { create(:timesheet_entry, project:, user: admin) }
  let(:type) { "csv" }

  before do
    create(:company_user, user: admin, company:)
    create(:company_user, user: employee, company:)
    admin.add_role :admin, company
    employee.add_role :employee, company
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
          "#{timesheet_entry.work_date.strftime("%Y-%m-%d")}," \
          "#{timesheet_entry.formatted_duration}"
      end

      it "returns CSV data in response" do
        expect(subject).to eq 200
        expect(response.body).to include(csv_headers)
        expect(response.body).to include(csv_data)
      end
    end

    context "when pdf file requested" do
      let(:type) { "pdf" }

      it "generates PDF and send in response" do
        expect(subject).to eq 200
        expect(response.body).to include("PDF")
      end
    end
  end

  context "when user is an employee" do
    before { sign_in employee }

    it "returns 403 status" do
      expect(subject).to eq 403
      expect(json_response["errors"]).to eq "You are not authorized to perform this action."
    end
  end
end
