# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Viewing hours logged by time frame" do
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
    login_as(user)
    create(:timesheet_entry, user:, project: project1, duration: 954231, work_date: DateTime.now - 1.days)
    create(:timesheet_entry, user:, project: project1, duration: 3432, work_date: 2.weeks.ago)
    create(:timesheet_entry, user:, project: project2, duration: 4332, work_date: DateTime.now - 3.days)
    create(:timesheet_entry, user:, project: project3, duration: 12244, work_date: DateTime.now - 2.days)
    client1_total_minutes = client1.timesheet_entries.sum(:duration)
    client2_total_minutes = client2.timesheet_entries.sum(:duration)
  end

  context "when viewing hours logged for last week" do
    it "displays the correct totals for each client" do
      with_forgery_protection do
        visit "/clients"

        client1_hours = sprintf(
          "%02d:%02d", client1.project_details("week").sum { |project|
  project[:minutes_spent]
} / 60, client1.project_details("week").sum { |project|
  project[:minutes_spent]
} % 60)

        client1_total = find("div.total-hours", id: "#{client1.id}").text
        client2_total = find("div.total-hours", id: "#{client2.id}").text

        expect(client1_total).to eq(client1_hours)
        expect(client2_total).to eq(client2_hours)
      end
    end
  end
end
