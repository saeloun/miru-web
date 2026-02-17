# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TimesheetEntry#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:client2) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:project2) { create(:project, client: client2) }
  let!(:timesheet_entry1) {
    create(:timesheet_entry, user:, project:, work_date: Time.now - 30.days)
  }
  let!(:timesheet_entry2) {
    create(:timesheet_entry, user:, project: project2, work_date: Time.now - 25.days)
  }
  let!(:timesheet_entry3) {
    create(:timesheet_entry, user:, project: project2, work_date: Time.now - 3.days)
  }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      send_request :get, api_v1_timesheet_entry_index_path, params: {
        from: Time.now - 35.days,
        to: Time.now - 20.days
      }, headers: auth_headers(user)
    end

    it "they should be able to access records successfully" do
      expect(response).to have_http_status(:ok)
    end

    it "returns the timesheet entry" do
      expect(json_response["entries"].size).to eq(2)

      expect(json_response["entries"].keys)
        .to include(timesheet_entry1.work_date.strftime("%F"), timesheet_entry2.work_date.strftime("%F"))
      expect(json_response["entries"].keys)
        .not_to include(timesheet_entry3.work_date.strftime("%F"))
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, api_v1_timesheet_entry_index_path, params: {
        from: Time.now - 35.days,
        to: Time.now - 20.days
      }, headers: auth_headers(user)
    end

    it "they should be able to access records successfully" do
      expect(response).to have_http_status(:ok)
    end

    it "returns the timesheet entry" do
      expect(json_response["entries"].size).to eq(2)

      expect(json_response["entries"].keys)
        .to include(timesheet_entry1.work_date.strftime("%F"), timesheet_entry2.work_date.strftime("%F"))
      expect(json_response["entries"].keys)
        .not_to include(timesheet_entry3.work_date.strftime("%F"))
    end
  end

  context "when unauthenticated" do
    it "user will be redirected to sign in path" do
      send_request :get, api_v1_timesheet_entry_index_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
