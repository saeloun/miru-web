# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimesheetEntry, type: :model do
  let(:timesheet_entry) { build(:timesheet_entry) }

  it "is valid with valid attributes" do
    expect(timesheet_entry).to be_valid
  end

  it "is not valid without a duration" do
    timesheet_entry.duration = nil
    expect(timesheet_entry).to_not be_valid
  end

  it "is not valid if duration is greater than 24 hours" do
    timesheet_entry.duration = 1441 # 24 hours + 1 minute
    expect(timesheet_entry).to_not be_valid
  end

  it "is not valid if duration is less than 0 hours" do
    timesheet_entry.duration = -1
    expect(timesheet_entry).to_not be_valid
  end

  it "is not valid without a note" do
    timesheet_entry.note = nil
    expect(timesheet_entry).to_not be_valid
  end

  it "is not valid without a wotk_date" do
    timesheet_entry.work_date = nil
    expect(timesheet_entry).to_not be_valid
  end

  it "is not valid if bill_status is not one of the allowed values" do
    timesheet_entry.bill_status == "non_billable" || "billable"
  end
end
