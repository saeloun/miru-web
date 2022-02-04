# frozen_string_literal: true

require "rails_helper"
require "spec_helper"

PATH = "/internal_api/v1/timesheet_entry"
headers = { "ACCEPT" => "application/json" }
timesheet_entry = {
  duration: 120,
  work_date: "2020-02-02",
  note: "Test"
}

RSpec.describe "TimesheetEntry", type: :request do
  let (:company)  { create(:company) }
  let (:user) { create(:user, company: company) }
  let (:client)  { create(:client, company: company) }
  let (:project)  { create(:project, client: client) }

  context "when user is authenticated" do
    it "creates a timesheet entry" do
      sign_in user
      post PATH, params: { project_name: "Miru",
        timesheet_entry: timesheet_entry
      }.to_json, headers: headers
      expect(response).to have_http_status(:ok)
    end

    it "gets timesheet entries from date to date" do
      sign_in user
      get "#{path}?from=2020-02-01&to=2020-02-03", headers: headers
      expect(response).to have_http_status(:ok)
    end

    it "update the timesheet entries of given id" do
      sign_in user
      put "#{path}/1", params: { project_name: "Miru",
        timesheet_entry: timesheet_entry }.to_json,
        headers: headers
      expect(response).to have_http_status(:ok)
    end

    it "delete the timesheet entries of given id" do
      sign_in user
      delete "#{path}/1", headers: headers
      expect(response).to have_http_status(:ok)
    end
  end
end
