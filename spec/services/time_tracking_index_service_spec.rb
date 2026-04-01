# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeTrackingIndexService do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Acme") }
  let(:project) { create(:project, client:, name: "Client Work") }
  let(:leave) { create(:leave, company:, year: Date.current.year) }
  let!(:leave_type) { create(:leave_type, leave:, name: "Annual Leave") }
  let!(:custom_leave) { create(:custom_leave, leave:, name: "Wellness Leave") }
  let!(:employment_admin) { create(:employment, company:, user: admin) }
  let!(:employment_employee) { create(:employment, company:, user: employee) }
  let!(:project_member) { create(:project_member, user: employee, project:) }
  let!(:timesheet_entry) do
    create(:timesheet_entry,
      user: employee,
      project:,
      work_date: Date.current,
      duration: 120,
      note: "Tracked time")
  end
  let!(:timeoff_entry) do
    create(:timeoff_entry,
      user: employee,
      leave_type:,
      leave_date: Date.current,
      duration: 480,
      note: "Annual leave")
  end

  before do
    admin.add_role :admin, company
    employee.add_role :employee, company
    create(:custom_leave_user, custom_leave:, user: employee)
  end

  describe "#process" do
    it "returns employee-scoped clients, projects, and entries" do
      result = described_class.new(
        current_user: employee,
        user: employee,
        company: company,
        from: Date.current.beginning_of_month,
        to: Date.current.end_of_month,
        year: Date.current.year
      ).process

      expect(result[:clients].map(&:id)).to eq([client.id])
      expect(result[:projects].keys).to eq([client.name])
      expect(result[:projects][client.name].map(&:id)).to eq([project.id])
      expect(result[:entries].keys).to include(Date.current)
      expect(result[:employees].map(&:id)).to eq([employee.id])
      expect(result[:leave_types].map(&:id)).to include(leave_type.id)
      expect(result[:leave_types].map(&:id)).to include(custom_leave.id)
    end

    it "excludes custom leaves that are not assigned to the user" do
      other_user = create(:user, current_workspace_id: company.id)
      other_custom_leave = create(:custom_leave, leave:, name: "Other Leave")
      create(:employment, company:, user: other_user)
      create(:custom_leave_user, custom_leave: other_custom_leave, user: other_user)

      result = described_class.new(
        current_user: employee,
        user: employee,
        company: company,
        from: Date.current.beginning_of_month,
        to: Date.current.end_of_month,
        year: Date.current.year
      ).process

      expect(result[:leave_types].map(&:id)).not_to include(other_custom_leave.id)
    end
  end

  describe "#entries_payload" do
    it "returns only range data needed by refresh requests" do
      result = described_class.new(
        current_user: employee,
        user: employee,
        company: company,
        from: Date.current.beginning_of_month,
        to: Date.current.end_of_month,
        year: Date.current.year
      ).entries_payload

      expect(result.keys).to contain_exactly(:entries, :leave_types, :holiday_infos)
      expect(result[:entries].keys).to include(Date.current)
      entry_ids = result[:entries][Date.current].pluck(:id)
      expect(entry_ids).to include(timesheet_entry.id, timeoff_entry.id)
      expect(result[:leave_types].map(&:id)).to include(leave_type.id, custom_leave.id)
    end
  end
end
