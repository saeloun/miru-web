# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimesheetEntry#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:, billable: true) }

  before {
    @timesheet_details = {
      project_id: project.id,
      duration: 20,
      work_date: Time.now,
      note: "Test Note",
      bill_status: :unbilled
    }
  }

  context "when successful creation" do
    before do
      create(:employment, company:, user:)
      create(:project_member, project:, user:)
      user.add_role :employee, company
    end

    context "when user is an employee and send token in params" do
      before do
        send_request :post, api_v1_timesheet_entry_index_path,
          params:
          {
            timesheet_entry: @timesheet_details,
            auth_token: user.token
          },
          headers: auth_headers(user)
      end

      it "he should be able to create timesheet entry record successfully" do
        expect(response).to have_http_status(:ok)
      end

      it "receives successful json response" do
        expect(json_response["entry"]["project_id"]).to match(project.id)
        expect(json_response["notice"]).to match("Timesheet created")
      end
    end

    context "when user is an employee and sends token in bearer" do
      before do
        send_request :post, api_v1_timesheet_entry_index_path,
          params:
          {
            timesheet_entry: @timesheet_details
          },
          headers: auth_headers(user)
      end

      it "he should be able to create timesheet entry record successfully" do
        expect(response).to have_http_status(:ok)
      end

      it "receives successful json response" do
        expect(json_response["entry"]["project_id"]).to match(project.id)
        expect(json_response["notice"]).to match("Timesheet created")
      end
    end

    context "when user does not send all params(note & bill status) in the request" do
      it "sets default values" do
        create(:employment, company:, user:)
        create(:project_member, project:, user:)
        send_request :post, api_v1_timesheet_entry_index_path,
          params:
          {
            timesheet_entry:
            {
              project_id: project.id,
              duration: 20,
              work_date: Time.now
            }
          },
          headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["entry"]["note"]).to match("")
        expect(json_response["entry"]["bill_status"]).to match("unbilled")
      end
    end
  end

  context "when unsuccessful" do
    it "user Token is invalid" do
      send_request :post, api_v1_timesheet_entry_index_path,
        params:
        {
          timesheet_entry: @timesheet_details
        },
        headers: auth_headers({ email: user.email, token: "Abc" })
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to match(I18n.t("devise.failure.unauthenticated"))
    end

    it "user is not a project member for the given project id" do
      send_request :post, api_v1_timesheet_entry_index_path,
        params:
        {
          timesheet_entry: @timesheet_details
        },
        headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
      expect(json_response["notice"]).to match("User is not a project member.")
    end
  end
end
