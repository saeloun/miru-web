# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Viewing hours logged by time frame", type: :system do
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
    sign_in(user)
  end

  context "when viewing hours logged for current week" do
    before do
      create(:timesheet_entry, user:, project: project1, duration: 120, work_date: Date.today.at_beginning_of_week)
      create(:timesheet_entry, user:, project: project1, duration: 45, work_date: Date.today.at_beginning_of_week)
      create(:timesheet_entry, user:, project: project2, duration: 200, work_date: Date.today.at_beginning_of_week)
      create(:timesheet_entry, user:, project: project3, duration: 78, work_date: Date.today.at_beginning_of_week)
    end

    it "displays the correct totals for each client" do
      with_forgery_protection do
        visit "/clients"

        expect(page).to have_selector(id: "#{client1.id}", text: "06:05")
        expect(page).to have_selector(id: "#{client2.id}", text: "01:18")
      end
    end
  end

  context "when viewing hours logged for current month" do
    before do
      create(:timesheet_entry, user:, project: project1, duration: 70, work_date: Date.today.at_beginning_of_month)
      create(:timesheet_entry, user:, project: project1, duration: 90, work_date: Date.today.at_beginning_of_month)
      create(:timesheet_entry, user:, project: project2, duration: 120, work_date: Date.today.at_beginning_of_month)
      create(:timesheet_entry, user:, project: project3, duration: 48, work_date: Date.today.at_beginning_of_month)
    end

    it "displays the correct totals for each client" do
      with_forgery_protection do
        visit "/clients"

        select "THIS MONTH", from: "timeFrame"
        expect(page).to have_selector(id: "#{client1.id}", text: "04:40")
        expect(page).to have_selector(id: "#{client2.id}", text: "00:48")
      end
    end
  end

  context "when viewing hours logged for current year" do
    before do
      create(:timesheet_entry, user:, project: project1, duration: 170, work_date: Date.today.beginning_of_year)
      create(:timesheet_entry, user:, project: project1, duration: 290, work_date: Date.today.beginning_of_year)
      create(:timesheet_entry, user:, project: project2, duration: 146, work_date: Date.today.beginning_of_year)
      create(:timesheet_entry, user:, project: project3, duration: 158, work_date: Date.today.beginning_of_year)
    end

    it "displays the correct totals for each client" do
      with_forgery_protection do
        visit "/clients"

        select "THIS YEAR", from: "timeFrame"
        expect(page).to have_selector(id: "#{client1.id}", text: "10:06")
        expect(page).to have_selector(id: "#{client2.id}", text: "02:38")
      end
    end
  end
end
