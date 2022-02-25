# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimesheetEntry, type: :model do
  let(:timesheet_entry) { create(:timesheet_entry) }

  describe "Associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:project) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:duration) }
    it { is_expected.to validate_presence_of(:note) }
    it { is_expected.to validate_presence_of(:work_date) }
    it { is_expected.to validate_presence_of(:bill_status) }
    it do
      is_expected.to validate_numericality_of(:duration).
      is_less_than_or_equal_to(Minutes.in_a_day).
      is_greater_than_or_equal_to(0.0)
    end
  end

  describe "Callbacks" do
    it { is_expected.to callback(:ensure_bill_status_is_set).before(:validation) }
    it { is_expected.to callback(:ensure_bill_status_is_not_billed).before(:validation) }
    it { is_expected.to callback(:ensure_billed_status_should_not_be_changed).before(:validation) }
  end

  describe ".during" do
    pending("Will work on this")
  end

  describe "#formatted_entry" do
    it "returns proper data" do
      expect(timesheet_entry.formatted_entry).to eq(
        {
          id: timesheet_entry.id,
          project: timesheet_entry.project.name,
          project_id: timesheet_entry.project.id,
          client: timesheet_entry.project.client.name,
          duration: timesheet_entry.duration,
          note: timesheet_entry.note,
          work_date: timesheet_entry.work_date,
          bill_status: timesheet_entry.bill_status
        }
      )
    end
  end
end
