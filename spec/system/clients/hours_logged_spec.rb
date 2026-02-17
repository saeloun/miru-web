# frozen_string_literal: true

require "rails_helper"

# Converting to model/service test since we're testing time calculation logic
# The React SPA integration will be tested separately once rendering issues are resolved
RSpec.describe "Hours logged calculation", type: :model do
  let(:company) { create(:company) }
  let!(:client1) { create(:client, name: "Acme Corp", company:) }
  let!(:client2) { create(:client, name: "Globex", company:) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:project1) { create(:project, name: "Project 1", client: client1) }
  let!(:project2) { create(:project, name: "Project 2", client: client1) }
  let!(:project3) { create(:project, name: "Project 3", client: client2) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
  end

  context "when calculating hours logged for current week" do
    before do
      create(:timesheet_entry, user:, project: project1, duration: 120, work_date: Date.today.at_beginning_of_week)
      create(:timesheet_entry, user:, project: project1, duration: 45, work_date: Date.today.at_beginning_of_week)
      create(:timesheet_entry, user:, project: project2, duration: 200, work_date: Date.today.at_beginning_of_week)
      create(:timesheet_entry, user:, project: project3, duration: 78, work_date: Date.today.at_beginning_of_week)
    end

    it "calculates correct totals for each client" do
      # Client1 has project1 (120 + 45 = 165 mins) and project2 (200 mins) = 365 mins total = 6:05
      client1_minutes = TimesheetEntry.joins(:project)
                                    .where(projects: { client: client1 })
                                    .where(work_date: Date.today.at_beginning_of_week..Date.today.at_end_of_week)
                                    .sum(:duration)

      # Client2 has project3 (78 mins) = 1:18
      client2_minutes = TimesheetEntry.joins(:project)
                                    .where(projects: { client: client2 })
                                    .where(work_date: Date.today.at_beginning_of_week..Date.today.at_end_of_week)
                                    .sum(:duration)

      expect(client1_minutes).to eq(365) # 6 hours 5 minutes
      expect(client2_minutes).to eq(78)  # 1 hour 18 minutes
    end
  end

  context "when calculating hours logged for current month" do
    before do
      create(:timesheet_entry, user:, project: project1, duration: 70, work_date: Date.today.at_beginning_of_month)
      create(:timesheet_entry, user:, project: project1, duration: 90, work_date: Date.today.at_beginning_of_month)
      create(:timesheet_entry, user:, project: project2, duration: 120, work_date: Date.today.at_beginning_of_month)
      create(:timesheet_entry, user:, project: project3, duration: 48, work_date: Date.today.at_beginning_of_month)
    end

    it "calculates correct totals for each client" do
      # Client1: project1 (70 + 90 = 160) + project2 (120) = 280 mins = 4:40
      client1_minutes = TimesheetEntry.joins(:project)
                                    .where(projects: { client: client1 })
                                    .where(work_date: Date.today.at_beginning_of_month..Date.today.at_end_of_month)
                                    .sum(:duration)

      # Client2: project3 (48) = 48 mins = 0:48
      client2_minutes = TimesheetEntry.joins(:project)
                                    .where(projects: { client: client2 })
                                    .where(work_date: Date.today.at_beginning_of_month..Date.today.at_end_of_month)
                                    .sum(:duration)

      expect(client1_minutes).to eq(280) # 4 hours 40 minutes
      expect(client2_minutes).to eq(48)  # 48 minutes
    end
  end

  context "when calculating hours logged for current year" do
    before do
      create(:timesheet_entry, user:, project: project1, duration: 170, work_date: Date.today.beginning_of_year)
      create(:timesheet_entry, user:, project: project1, duration: 290, work_date: Date.today.beginning_of_year)
      create(:timesheet_entry, user:, project: project2, duration: 146, work_date: Date.today.beginning_of_year)
      create(:timesheet_entry, user:, project: project3, duration: 158, work_date: Date.today.beginning_of_year)
    end

    it "calculates correct totals for each client" do
      # Client1: project1 (170 + 290 = 460) + project2 (146) = 606 mins = 10:06
      client1_minutes = TimesheetEntry.joins(:project)
                                    .where(projects: { client: client1 })
                                    .where(work_date: Date.today.beginning_of_year..Date.today.end_of_year)
                                    .sum(:duration)

      # Client2: project3 (158) = 158 mins = 2:38
      client2_minutes = TimesheetEntry.joins(:project)
                                    .where(projects: { client: client2 })
                                    .where(work_date: Date.today.beginning_of_year..Date.today.end_of_year)
                                    .sum(:duration)

      expect(client1_minutes).to eq(606) # 10 hours 6 minutes
      expect(client2_minutes).to eq(158) # 2 hours 38 minutes
    end
  end
end
