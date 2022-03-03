# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimesheetEntry, type: :model do
  let (:company) { create(:company) }
  let (:company2) { create(:company) }
  let(:client) { create(:client, company_id: company.id) }
  let(:client2) { create(:client, company_id: company2.id) }
  let(:project) { create(:project, client_id: client.id) }
  let(:project2) { create(:project, client_id: client2.id) }
  let(:timesheet_entry) { create(:timesheet_entry, project_id: project.id) }

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
    it { is_expected.to callback(:insure_bill_status_is_set).before(:validation) }
  end

  describe "Scopes" do
    before do
      @timesheet_entry1 = create(:timesheet_entry, project_id: project.id)
      @timesheet_entry2 = create(:timesheet_entry, project_id: project2.id)
      @timesheet_entry3 = create(:timesheet_entry, project_id: project2.id)
    end

    describe ".in_workspace" do
      it "returns timesheet entries that are associated with project 1" do
        expect(described_class.in_workspace(company)).to include(timesheet_entry, @timesheet_entry1)
        expect(described_class.in_workspace(company)).not_to include(@timesheet_entry2, @timesheet_entry3)
      end

      it "excludes timesheet entries that are associated with project 1" do
        expect(described_class.in_workspace(company2)).not_to include(timesheet_entry, @timesheet_entry1)
        expect(described_class.in_workspace(company2)).to include(@timesheet_entry2, @timesheet_entry3)
      end
    end
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
          client: timesheet_entry.project.client.name,
          duration: timesheet_entry.duration,
          note: timesheet_entry.note,
          work_date: timesheet_entry.work_date,
          bill_status: timesheet_entry.bill_status,
          team_member: timesheet_entry.user.full_name
        }
      )
    end
  end
end
