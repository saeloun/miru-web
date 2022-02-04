# frozen_string_literal: true

require "rails_helper"

RSpec.describe "TimesheetEntry", type: :request do
  it "creates a timesheet entry" do
    post "/internal_api/v1"
  end

  it "gets timesheet entries from date to date" do
    get ""
  end

  it "update the timesheet entries of given id" do
    put
  end
end
