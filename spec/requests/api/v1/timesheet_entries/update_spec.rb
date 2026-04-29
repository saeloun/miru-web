# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimesheetEntry#update", type: :request do
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
      work_date: Time.current,
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
    end

    it "they should be able to update the record successfully" do
      send_request :patch, api_v1_timesheet_entry_path(timesheet_entry.id), params: {
        project_id: project.id,
        timesheet_entry: {
          duration: 20,
          work_date: Time.current,
          note: "Updated Note",
          bill_status: :billed
        }
      }, headers: auth_headers(user)
      expect(response).to be_successful
    end

    it "returns success json response" do
      send_request :patch, api_v1_timesheet_entry_path(timesheet_entry.id), params: {
        project_id: project.id,
        timesheet_entry: {
          duration: 20,
          work_date: Time.current,
          note: "Updated Note",
          bill_status: :billed
        }
      }, headers: auth_headers(user)

      expect(json_response["entry"]["duration"]).to match(20.0)
      expect(json_response["entry"]["note"]).to match("Updated Note")
      expect(json_response["entry"]["bill_status"]).to match("billed")
      expect(json_response["notice"]).to match("Timesheet updated")

      timesheet_entry.reload
      expect(timesheet_entry.duration).to eq(20)
      expect(timesheet_entry.note).to eq("Updated Note")
      expect(timesheet_entry.bill_status).to eq("billed")
    end

    context "when time entry record is billed one" do
      before do
        timesheet_entry.update!(bill_status: "billed")
      end

      it "they should be able to update billed time entry record to unbiiled successfully" do
        expect(timesheet_entry.bill_status).to eq("billed")

        send_request :patch, api_v1_timesheet_entry_path(timesheet_entry.id), params: {
          project_id: project.id,
          timesheet_entry: {
            bill_status: :unbilled
          }
        }, headers: auth_headers(user)

        expect(response).to be_successful
        expect(json_response["entry"]["bill_status"]).to match("unbilled")
      end
    end

    it "does not update entries from another workspace" do
      other_company = create(:company)
      other_client = create(:client, company: other_company)
      other_project = create(:project, client: other_client)
      other_entry = create(:timesheet_entry, project: other_project, note: "Other workspace")

      send_request :patch, api_v1_timesheet_entry_path(other_entry.id), params: {
        project_id: project.id,
        timesheet_entry: {
          duration: 20,
          note: "Updated across workspace"
        }
      }, headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
      expect(other_entry.reload.note).to eq("Other workspace")
    end

    it "does not move entries to projects from another workspace" do
      other_company = create(:company)
      other_client = create(:client, company: other_company)
      other_project = create(:project, client: other_client)

      send_request :patch, api_v1_timesheet_entry_path(timesheet_entry.id), params: {
        project_id: other_project.id,
        timesheet_entry: {
          duration: 20,
          note: "Invalid move"
        }
      }, headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
      timesheet_entry.reload
      expect(timesheet_entry.project_id).to eq(project.id)
      expect(timesheet_entry.note).to eq("Test note")
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "they should be able to update the record successfully" do
      send_request :patch, api_v1_timesheet_entry_path(timesheet_entry.id), params: {
        project_id: project.id,
        timesheet_entry: {
          duration: 20,
          work_date: Time.current,
          note: "Updated Note",
          bill_status: :billed
        }
      }, headers: auth_headers(user)
      expect(response).to be_successful
    end

    it "returns success json response" do
      send_request :patch, api_v1_timesheet_entry_path(timesheet_entry.id), params: {
        project_id: project.id,
        timesheet_entry: {
          duration: 20,
          work_date: Time.current,
          note: "Updated Note",
          bill_status: :billed
        }
      }, headers: auth_headers(user)

      expect(json_response["entry"]["duration"]).to match(20.0)
      expect(json_response["entry"]["note"]).to match("Updated Note")
      expect(json_response["entry"]["bill_status"]).to match("billed")
      expect(json_response["notice"]).to match("Timesheet updated")

      timesheet_entry.reload
      expect(timesheet_entry.duration).to eq(20)
      expect(timesheet_entry.note).to eq("Updated Note")
      expect(timesheet_entry.bill_status).to eq("billed")
    end

    context "when time entry record is billed one" do
      before do
        timesheet_entry.update!(bill_status: "billed")
      end

      it "they should not be able to update billed time entry record" do
        expect(timesheet_entry.bill_status).to eq("billed")

        send_request :patch, api_v1_timesheet_entry_path(timesheet_entry.id), params: {
          project_id: project.id,
          timesheet_entry: {
            bill_status: :unbilled
          }
        }, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
        expect(json_response["errors"]).to include("You are not authorized to perform this action.")
      end
    end

    context "when the entry is older than one week" do
      before do
        timesheet_entry.update!(work_date: 30.days.ago)
      end

      it "returns forbidden for updates" do
        send_request :patch, api_v1_timesheet_entry_path(timesheet_entry.id), params: {
          project_id: project.id,
          timesheet_entry: {
            duration: 20,
            work_date: Time.current,
            note: "Updated Note",
            bill_status: :billed
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
    end

    it "they should not be able to update the record" do
      original_updated_at = timesheet_entry.updated_at

      send_request :patch, api_v1_timesheet_entry_path(timesheet_entry.id), params: {
        project_id: project.id,
        timesheet_entry: {
          duration: 20,
          work_date: Time.current,
          note: "Updated Note",
          bill_status: :billed
        }
      }, headers: auth_headers(user2)

      expect(response).to have_http_status(:forbidden)
      expect(timesheet_entry.reload.updated_at.to_i).to eq(original_updated_at.to_i)
    end

    it "returns success json response" do
      send_request :patch, api_v1_timesheet_entry_path(timesheet_entry.id), params: {
        project_id: project.id,
        timesheet_entry: {
          duration: 20,
          work_date: Time.current,
          note: "Updated Note",
          bill_status: :billed
        }
      }, headers: auth_headers(user2)

      expect(json_response["errors"]).to include("You are not authorized to perform this action.")
    end
  end

  context "when unauthenticated" do
    it "user will be redirected to sign in path" do
      send_request :patch, api_v1_timesheet_entry_path(timesheet_entry.id)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to match(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
