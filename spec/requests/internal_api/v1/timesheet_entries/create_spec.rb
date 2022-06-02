# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::TimesheetEntry#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request :post, internal_api_v1_timesheet_entry_index_path, params: {
        project_id: project.id,
        timesheet_entry: {
          duration: 20,
          work_date: Time.now,
          note: "Test Note",
          bill_status: :unbilled
        },
        user_id: user.id
      }
    end

    it "they should be able to create the record successfully" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["entry"]["project_id"]).to match(project.id)
      expect(json_response["notice"]).to match("Timesheet created")
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :post, internal_api_v1_timesheet_entry_index_path, params: {
        project_id: project.id,
        timesheet_entry: {
          duration: 20,
          work_date: Time.now,
          note: "Test Note",
          bill_status: :unbilled
        },
        user_id: user.id
      }
    end

    it "they should be able to create the record successfully" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["entry"]["project_id"]).to match(project.id)
      expect(json_response["notice"]).to match("Timesheet created")
    end
  end

  context "when unauthenticated" do
    it "user will be redirected to sign in path" do
      send_request :post, internal_api_v1_timesheet_entry_index_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to match("You need to sign in or sign up before continuing.")
    end
  end
end
