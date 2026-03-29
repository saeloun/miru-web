# frozen_string_literal: true

# == Schema Information
#
# Table name: timesheet_entries
#
#  id           :bigint           not null, primary key
#  bill_status  :integer          not null
#  discarded_at :datetime
#  duration     :float            not null
#  locked       :boolean          default(FALSE)
#  note         :text             default("")
#  source       :string           default("manual"), not null
#  source_metadata :jsonb         not null
#  work_date    :date             not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  project_id   :bigint           not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_timesheet_entries_on_bill_status   (bill_status)
#  index_timesheet_entries_on_discarded_at  (discarded_at)
#  index_timesheet_entries_on_note_trgm     (note) USING gin
#  index_timesheet_entries_on_project_id    (project_id)
#  index_timesheet_entries_on_user_id       (user_id)
#  index_timesheet_entries_on_work_date     (work_date)
#
# Foreign Keys
#
#  fk_rails_...  (project_id => projects.id)
#  fk_rails_...  (user_id => users.id)
#
require "rails_helper"

RSpec.describe TimesheetEntry, type: :model do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:client) { create(:client, company:) }
  let(:client2) { create(:client, company_id: company2.id) }
  let(:project) { create(:project, client_id: client.id) }
  let(:project2) { create(:project, client_id: client2.id) }
  let(:billable_project) { create(:project, billable: true, client_id: client.id) }
  let(:timesheet_entry) { create(:timesheet_entry, project:) }

  describe "Associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:project) }
    it { is_expected.to belong_to(:agent).optional }
    it { is_expected.to have_one(:invoice_line_item).dependent(:destroy) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:duration) }
    it { is_expected.to validate_presence_of(:work_date) }
    it { is_expected.to validate_presence_of(:bill_status) }

    it do
      expect(subject).to validate_numericality_of(:duration)
        .is_less_than_or_equal_to(6000000)
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

  describe "#snippet" do
    it "returns proper data" do
      expect(timesheet_entry.snippet).to eq(
        {
          id: timesheet_entry.id,
          project: timesheet_entry.project.name,
          project_id: timesheet_entry.project.id,
          client: timesheet_entry.project.client.name,
          duration: timesheet_entry.duration,
          note: timesheet_entry.note,
          work_date: timesheet_entry.work_date,
          bill_status: timesheet_entry.bill_status,
          review_status: "not_required",
          team_member: timesheet_entry.user.full_name,
          agent_id: nil,
          agent_name: nil,
          source: "manual",
          source_label: nil,
          source_metadata: {},
          proof_url: nil,
          proof_metadata: {},
          type: "timesheet"
        }
      )
    end
  end

  describe "review defaults" do
    it "marks agent-attributed entries as pending review" do
      agent_user = create(:user, current_workspace_id: company.id)
      create(:employment, company:, user: agent_user)
      agent = create(:agent, company:, user: agent_user)
      entry = build(:timesheet_entry, project: billable_project, user: agent_user, agent:)

      entry.valid?

      expect(entry.review_status).to eq("pending_review")
    end

    it "keeps human entries as not required" do
      entry = build(:timesheet_entry, project: billable_project, user: timesheet_entry.user)

      entry.valid?

      expect(entry.review_status).to eq("not_required")
    end
  end

  describe "proof metadata normalization" do
    it "normalizes values into a bounded top-level hash" do
      timesheet_entry.assign_attributes(
        proof_metadata: {
          artifact: "build-log",
          attempts: 2,
          ok: false,
          nested: { ignored: "but stringified" }
        }
      )

      timesheet_entry.valid?

      expect(timesheet_entry.proof_metadata).to eq(
        "artifact" => "build-log",
        "attempts" => 2,
        "ok" => false,
        "nested" => "{\"ignored\" => \"but stringified\"}"
      )
    end
  end

  describe "source normalization" do
    it "normalizes blank and unknown sources to manual" do
      timesheet_entry.assign_attributes(source: "unknown", source_metadata: { tool: "", skill: nil, extra: "ignore-me" })
      timesheet_entry.valid?

      expect(timesheet_entry.source).to eq("manual")
      expect(timesheet_entry.source_metadata).to eq({})
      expect(timesheet_entry.source_label).to be_nil
    end

    it "builds readable labels for AI-assisted entries" do
      timesheet_entry.assign_attributes(
        source: "automation",
        source_metadata: {
          tool: "claude-code",
          skill: "gstack-review"
        }
      )
      timesheet_entry.valid?

      expect(timesheet_entry.source).to eq("automation")
      expect(timesheet_entry.source_label).to eq("Claude Code via Automation")
    end

    it "persists only allowlisted source metadata keys" do
      timesheet_entry.assign_attributes(
        source: "mcp",
        source_metadata: {
          tool: "codex",
          skill: "gstack-qa",
          mcp_server: "github",
          pii: "should-not-stick"
        }
      )
      timesheet_entry.valid?

      expect(timesheet_entry.source_metadata).to eq(
        "tool" => "codex",
        "skill" => "gstack-qa",
        "mcp_server" => "github"
      )
    end

    it "truncates source metadata values to the supported length" do
      long_value = "x" * 140

      timesheet_entry.assign_attributes(
        source: "mcp",
        source_metadata: { tool: long_value }
      )
      timesheet_entry.valid?

      expect(timesheet_entry.source_metadata["tool"]).to eq("x" * 100)
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

  describe "#validate_billable_project" do
    let(:error_message) { "You can't create an unbilled entry for non-billable projects" }

    context "when the project is non-billable" do
      it "returns an error if project is non billable and user try to create unbilled entry" do
        timesheet_entry = build(:timesheet_entry, bill_status: "unbilled")
        expect(timesheet_entry.valid?).to be_falsey
        expect(timesheet_entry.errors.messages[:base]).to include(error_message)
      end
    end

    context "when the project is billable" do
      it "does not return an error if the user tries to create an unbilled entry" do
        timesheet_entry = build(:timesheet_entry, bill_status: "unbilled", project: billable_project)
        expect(timesheet_entry.valid?).to be_truthy
        expect(timesheet_entry.errors.messages[:base]).not_to include(error_message)
      end
    end
  end

  describe "#ensure_billed_status_should_not_be_changed" do
    context "when admin or owner is updating the time entry" do
      before do
        admin.add_role([:owner, :admin].sample, company)
        Current.user = admin
        Current.company = company
      end

      let(:admin) { create(:user) }
      let(:timesheet_entry) { create(:timesheet_entry, project: billable_project) }

      context "when time entry is billed" do
        it "allows owners and admins to edit the billed time entry" do
          timesheet_entry.update!(bill_status: "billed")
          timesheet_entry.update(bill_status: "unbilled")

          expect(timesheet_entry.valid?).to be_truthy
          expect(timesheet_entry.bill_status).to eq("unbilled")
          expect(timesheet_entry.errors.blank?).to be true
        end
      end

      context "when time entry is non billable" do
        before do
          timesheet_entry.update!(bill_status: "non_billable")
        end

        it "allows owners and admins to edit the non billable time entry to unbilled" do
          expect(timesheet_entry.bill_status).to eq("non_billable")

          timesheet_entry.update(bill_status: "unbilled")

          expect(timesheet_entry.valid?).to be_truthy
          expect(timesheet_entry.bill_status).to eq("unbilled")
          expect(timesheet_entry.errors.blank?).to be true
        end
      end

      context "when time entry is unbilled" do
        before do
          timesheet_entry.update!(bill_status: "unbilled")
        end

        it "allows owners and admins to edit the unbilled time entry to non billable" do
          expect(timesheet_entry.bill_status).to eq("unbilled")

          timesheet_entry.update(bill_status: "non_billable")

          expect(timesheet_entry.valid?).to be_truthy
          expect(timesheet_entry.bill_status).to eq("non_billable")
          expect(timesheet_entry.errors.blank?).to be true
        end
      end
    end

    context "when employee is editing time entry" do
      before do
        user.add_role(:employee, company)
        Current.user = user
        Current.company = company
      end

      let(:user) { create(:user) }
      let(:timesheet_entry) { create(:timesheet_entry, project: billable_project) }
      let(:error_message) { "You can't bill an entry that has already been billed" }

      context "when time entry is billed" do
        it "does not allow to update billed time entry to employee" do
          timesheet_entry.update!(bill_status: "billed")
          timesheet_entry.update(bill_status: "unbilled")

          expect(timesheet_entry.valid?).to be_falsy
          expect(timesheet_entry.errors.messages[:timesheet_entry]).to eq([error_message])
        end
      end

      context "when time entry is not billed" do
        it "allows employee to change non billed time entries" do
          timesheet_entry.update(bill_status: "unbilled")

          expect(timesheet_entry.valid?).to be_truthy
          expect(timesheet_entry.errors.blank?).to be true
        end
      end
    end
  end

  describe "#prevent_edit_if_locked" do
    let(:admin) { create(:user) }
    let(:employee) { create(:user) }
    let(:timesheet_entry) { create(:timesheet_entry, project: billable_project, locked: true) }

    before do
      admin.add_role(:admin, company)
      employee.add_role(:employee, company)
      Current.company = company
    end

    context "when employee is editing a locked timesheet entry" do
      before do
        Current.user = employee
      end

      it "does not allow the employee to edit the locked timesheet entry" do
        timesheet_entry.update(duration: 10)

        expect(timesheet_entry.errors[:base]).to include("Cannot edit a locked timesheet entry. Please contact admin.")
      end
    end

    context "when admin is editing a locked timesheet entry" do
      before do
        Current.user = admin
      end

      it "allows the admin to edit the locked timesheet entry" do
        timesheet_entry.update(duration: 10)

        expect(timesheet_entry.errors[:base]).not_to include(
          "Cannot edit a locked timesheet entry.
          Please contact admin.")
      end
    end
  end
end
