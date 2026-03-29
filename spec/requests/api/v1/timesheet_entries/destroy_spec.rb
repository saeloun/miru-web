# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimesheetEntry#destroy", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let!(:timesheet_entry) {
    create(:timesheet_entry, user:, project:, work_date: Time.now - 30.days)
  }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request :delete, api_v1_timesheet_entry_path(timesheet_entry), headers: auth_headers(user)
    end

    it "they should be able to destroy the record successfully" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["notice"]).to match("Timesheet deleted")
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :delete, api_v1_timesheet_entry_path(timesheet_entry), headers: auth_headers(user)
    end

    it "they should be able to destroy the record successfully" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["notice"]).to match("Timesheet deleted")
    end
  end

  context "when employee tries to delete other user's timesheet entry" do
    before do
      create(:employment, company:, user:)
      user2.add_role :employee, company
      sign_in user2
      send_request :delete, api_v1_timesheet_entry_path(timesheet_entry), headers: auth_headers(user2)
    end

    it "they should not be able to delete the record" do
      expect(response).to have_http_status(:forbidden)
    end

    it "returns success json response" do
      expect(json_response["errors"]).to include("You are not authorized to perform this action.")
    end
  end

  context "when unauthenticated" do
    it "user will be redirected to sign in path" do
      send_request :delete, api_v1_timesheet_entry_path(timesheet_entry)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to match(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
