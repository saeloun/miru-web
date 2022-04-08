# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimesheetEntry, type: :model do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:client) { create(:client, company:) }
  let(:client2) { create(:client, company_id: company2.id) }
  let(:project) { create(:project, client_id: client.id) }
  let(:project2) { create(:project, client_id: client2.id) }
  let(:timesheet_entry) { create(:timesheet_entry, project:) }

  describe "Associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:project) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:duration) }
    it { is_expected.to validate_presence_of(:work_date) }
    it { is_expected.to validate_presence_of(:bill_status) }

    it do
      expect(subject).to validate_numericality_of(:duration)
        .is_less_than_or_equal_to(Minutes.in_a_day)
        .is_greater_than_or_equal_to(0.0)
    end
  end

  describe "Callbacks" do
    it { is_expected.to callback(:ensure_bill_status_is_set).before(:validation) }
    it { is_expected.to callback(:ensure_bill_status_is_not_billed).before(:validation) }
    it { is_expected.to callback(:ensure_billed_status_should_not_be_changed).before(:validation) }
  end

  describe "Scopes" do
    before do
      @timesheet_entry1 = create(:timesheet_entry, project:)
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
          project_id: timesheet_entry.project.id,
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

  describe "#ensure_bill_status_is_set" do
    it "returns non billable if project is not billable" do
      timesheet_entry.update(bill_status: nil)
      expect(timesheet_entry.reload).to have_attributes(bill_status: "non_billable")
    end

    it "returns billable if project is billable" do
      project.update(billable: true)
      timesheet_entry.update(bill_status: nil)
      expect(timesheet_entry.reload).to have_attributes(bill_status: "unbilled")
    end
  end

  describe "#ensure_bill_status_is_not_billed" do
    let(:error_message) { "You can't create a billed timesheet entry" }

    it "returns an error if project is created with billed status" do
      timesheet_entry = build(:timesheet_entry, bill_status: "billed")
      expect(timesheet_entry.valid?).to be_falsey
      expect(timesheet_entry.errors.messages[:timesheet_entry]).to eq([error_message])
    end
  end

  describe "#ensure_billed_status_should_not_be_changed" do
    let(:error_message) { "You can't bill an entry that has already been billed" }

    it "returns an error if status is changed for a billed entry" do
      timesheet_entry.update!(bill_status: "billed")
      timesheet_entry.update(bill_status: "unbilled")

      expect(timesheet_entry.valid?).to be_falsey
      expect(timesheet_entry.errors.messages[:timesheet_entry]).to eq([error_message])
    end
  end
end
