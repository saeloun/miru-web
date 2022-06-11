# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::TimesheetEntry#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
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

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
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
      }
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
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
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
      }
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
  end

  context "when employee tries to update other user's timesheet entry" do
    before do
      create(:company_user, company:, user: user2)
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
      }
    end

    it "they should not be able to update the record" do
      expect(response).to have_http_status(:forbidden)
    end

    it "returns success json response" do
      expect(json_response["errors"]).to include("You are not authorized to perform this action.")
    end
  end

  # context "when the user is an book keeper" do
  #   before do
  #     create(:company_user, company:, user: user2)
  #     user2.add_role :book_keeper, company
  #     sign_in user2
  #     send_request :patch, internal_api_v1_timesheet_entry_path(timesheet_entry.id), params: {
  #       project_id: project.id,
  #       timesheet_entry: {
  #         duration: 20,
  #         work_date: Time.now,
  #         note: "Updated Note",
  #         bill_status: :billed
  #       }
  #     }
  #   end
  #
  #   it "is not be permitted to update timehseet entry" do
  #     expect(response).to have_http_status(:forbidden)
  #   end
  # end

  context "when unauthenticated" do
    it "user will be redirected to sign in path" do
      send_request :patch, internal_api_v1_timesheet_entry_path(timesheet_entry.id)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to match("You need to sign in or sign up before continuing.")
    end
  end
end
