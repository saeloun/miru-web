# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::TimesheetEntry#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, billable: true, client:) }
  let!(:timesheet_entry) {
    create(
      :timesheet_entry,
      user:,
      project:,
      work_date: Time.now - 30.days,
      duration: 10,
      note: "Test note",
      bill_status: :unbilled
    )
  }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request :patch, internal_api_v1_timesheet_entry_path(timesheet_entry.id), params: {
        project_id: project.id,
        timesheet_entry: {
          duration: 20,
          work_date: Time.now,
          note: "Updated Note",
          bill_status: :billed
        }
      }, headers: auth_headers(user)
    end

    it "they should be able to update the record successfully" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["entry"]["duration"]).to match(20.0)
      expect(json_response["entry"]["note"]).to match("Updated Note")
      expect(json_response["entry"]["bill_status"]).to match("billed")
      expect(json_response["notice"]).to match("Timesheet updated")
    end

    context "when time entry record is billed one" do
      before do
        timesheet_entry.update!(bill_status: "billed")
      end

      it "they should be able to update billed time entry record to unbiiled successfully" do
        expect(timesheet_entry.bill_status).to eq("billed")

        send_request :patch, internal_api_v1_timesheet_entry_path(timesheet_entry.id), params: {
          project_id: project.id,
          timesheet_entry: {
            bill_status: :unbilled
          }
        }, headers: auth_headers(user)

        expect(response).to be_successful
        expect(json_response["entry"]["bill_status"]).to match("unbilled")
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :patch, internal_api_v1_timesheet_entry_path(timesheet_entry.id), params: {
        project_id: project.id,
        timesheet_entry: {
          duration: 20,
          work_date: Time.now,
          note: "Updated Note",
          bill_status: :billed
        }
      }, headers: auth_headers(user)
    end

    it "they should be able to update the record successfully" do
      expect(response).to be_successful
    end

    it "returns success json response" do
      expect(json_response["entry"]["duration"]).to match(20.0)
      expect(json_response["entry"]["note"]).to match("Updated Note")
      expect(json_response["entry"]["bill_status"]).to match("billed")
      expect(json_response["notice"]).to match("Timesheet updated")
    end

    context "when time entry record is billed one" do
      before do
        timesheet_entry.update!(bill_status: "billed")
      end

      it "they should not be able to update billed time entry record" do
        expect(timesheet_entry.bill_status).to eq("billed")

        send_request :patch, internal_api_v1_timesheet_entry_path(timesheet_entry.id), params: {
          project_id: project.id,
          timesheet_entry: {
            bill_status: :unbilled
          }
        }, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
        expect(json_response["errors"]).to include("You are not authorized to perform this action.")
      end
    end
  end

  context "when employee tries to update other user's timesheet entry" do
    before do
      create(:employment, company:, user: user2)
      user2.add_role :employee, company
      sign_in user2
      send_request :patch, internal_api_v1_timesheet_entry_path(timesheet_entry.id), params: {
        project_id: project.id,
        timesheet_entry: {
          duration: 20,
          work_date: Time.now,
          note: "Updated Note",
          bill_status: :billed
        }
      }, headers: auth_headers(user2)
    end

    it "they should not be able to update the record" do
      expect(response).to have_http_status(:forbidden)
    end

    it "returns success json response" do
      expect(json_response["errors"]).to include("You are not authorized to perform this action.")
    end
  end

  context "when unauthenticated" do
    it "user will be redirected to sign in path" do
      send_request :patch, internal_api_v1_timesheet_entry_path(timesheet_entry.id)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to match(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
