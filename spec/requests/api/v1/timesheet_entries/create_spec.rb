# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimesheetEntry#create", type: :request do
  let_it_be(:company) { create(:company) }
  let_it_be(:client) { create(:client, company:) }
  let_it_be(:project) { create(:project, billable: true, client:) }
  let(:user) { create(:user, email: "timesheet-create-#{SecureRandom.hex(6)}@example.com", current_workspace_id: company.id) }
  let(:work_date) { Date.current }
  let(:entry_params) do
    {
      project_id: project.id,
      timesheet_entry: {
        duration: 20,
        work_date: work_date,
        note: "Test Note",
        bill_status: :unbilled
      },
      user_id: user.id
    }
  end

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "they should be able to create the record successfully" do
      expect do
        send_request :post, api_v1_timesheet_entry_index_path, params: entry_params, headers: auth_headers(user)
      end.to change(TimesheetEntry, :count).by(1)

      expect(response).to be_successful
    end

    it "returns success json response" do
      send_request :post, api_v1_timesheet_entry_index_path, params: entry_params, headers: auth_headers(user)

      expect(json_response["entry"]["project_id"]).to match(project.id)
      expect(json_response["notice"]).to match("Timesheet created")

      created_entry = TimesheetEntry.find(json_response["entry"]["id"])
      expect(created_entry.user_id).to eq(user.id)
      expect(created_entry.project_id).to eq(project.id)
      expect(created_entry.note).to eq("Test Note")
      expect(created_entry.duration).to eq(20)
      expect(created_entry.bill_status).to eq("unbilled")
    end

    it "does not create entries on projects from another workspace" do
      other_company = create(:company)
      other_client = create(:client, company: other_company)
      other_project = create(:project, client: other_client)

      expect do
        send_request :post, api_v1_timesheet_entry_index_path,
          params: entry_params.merge(project_id: other_project.id),
          headers: auth_headers(user)
      end.not_to change(TimesheetEntry, :count)

      expect(response).to have_http_status(:not_found)
    end

    it "does not create entries for users from another workspace" do
      other_company = create(:company)
      other_user = create(:user, current_workspace_id: other_company.id)
      create(:employment, company: other_company, user: other_user)

      expect do
        send_request :post, api_v1_timesheet_entry_index_path,
          params: entry_params.merge(user_id: other_user.id),
          headers: auth_headers(user)
      end.not_to change(TimesheetEntry, :count)

      expect(response).to have_http_status(:not_found)
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "they should be able to create the record successfully" do
      expect do
        send_request :post, api_v1_timesheet_entry_index_path, params: entry_params, headers: auth_headers(user)
      end.to change(TimesheetEntry, :count).by(1)

      expect(response).to be_successful
    end

    it "returns success json response" do
      send_request :post, api_v1_timesheet_entry_index_path, params: entry_params, headers: auth_headers(user)

      expect(json_response["entry"]["project_id"]).to match(project.id)
      expect(json_response["notice"]).to match("Timesheet created")

      created_entry = TimesheetEntry.find(json_response["entry"]["id"])
      expect(created_entry.user_id).to eq(user.id)
      expect(created_entry.project_id).to eq(project.id)
      expect(created_entry.note).to eq("Test Note")
      expect(created_entry.duration).to eq(20)
    end
  end

  context "when the user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    it "is not be permitted to generate an timehseet entry" do
      expect do
        send_request :post, api_v1_timesheet_entry_index_path, params: entry_params, headers: auth_headers(user)
      end.not_to change(TimesheetEntry, :count)

      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "user will be redirected to sign in path" do
      send_request :post, api_v1_timesheet_entry_index_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to match(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
