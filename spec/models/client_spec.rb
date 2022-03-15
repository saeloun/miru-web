# frozen_string_literal: true

require "rails_helper"

RSpec.describe Client, type: :model do
  subject { build(:client) }

  describe "Validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:email) }
    # it { is_expected.to validate_uniqueness_of(:email) }
    it { is_expected.to allow_value("valid@email.com").for(:email) }
    it { is_expected.not_to allow_value("invalid@email").for(:email) }
  end

  describe "Associations" do
    it { is_expected.to have_many(:projects) }
    it { is_expected.to have_many(:timesheet_entries) }
    it { is_expected.to belong_to(:company) }
  end

  describe "Public methods" do
    describe "#total_hours_logged" do
      let (:company) { create(:company) }
      let (:user) { create(:user) }
      let (:client) { create(:client, company: company) }
      let (:project_1) { create(:project, client: client) }
      let (:project_2) { create(:project, client: client) }

      before do
        create_list(:timesheet_entry, 5, user: user, project: project_1)
        create_list(:timesheet_entry, 5, user: user, project: project_2)
      end

      context "when time_frame is last week" do
        let (:time_frame) { "last_week" }

        it "returns the total hours logged for a client in the last week" do
          from, to = client.week_month_year(time_frame)
          result = ([project_1, project_2].map { |project| project.timesheet_entries.where(work_date: from..to).sum(:duration) }).sum
          expect(client.total_hours_logged(time_frame)).to eq(result)
        end
      end

      context "when time_frame in a week" do
        let (:time_frame) { "week" }

        it "returns the total hours logged for a client in that week" do
          from, to = client.week_month_year(time_frame)
          result = ([project_1, project_2].map { |project| project.timesheet_entries.where(work_date: from..to).sum(:duration) }).sum
          expect(client.total_hours_logged(time_frame)).to eq(result)
        end
      end

      context "when time_frame in a month" do
        let (:time_frame) { "month" }

        it "returns the total hours logged for a client in that month" do
          from, to = client.week_month_year(time_frame)
          result = ([project_1, project_2].map { |project| project.timesheet_entries.where(work_date: from..to).sum(:duration) }).sum
          expect(client.total_hours_logged(time_frame)).to eq(result)
        end
      end

      context "when time_frame in a year" do
        let (:time_frame) { "year" }

        it "returns the total hours logged for a client in that year" do
          from, to = client.week_month_year(time_frame)
          result = ([project_1, project_2].map { |project| project.timesheet_entries.where(work_date: from..to).sum(:duration) }).sum
          expect(client.total_hours_logged(time_frame)).to eq(result)
        end
      end
    end

    describe "#project_details" do
      let (:company) { create(:company) }
      let (:user) { create(:user) }
      let (:client) { create(:client, company: company) }
      let (:project_1) { create(:project, client: client) }
      let (:project_2) { create(:project, client: client) }

      before do
        create_list(:timesheet_entry, 5, user: user, project: project_1)
        create_list(:timesheet_entry, 5, user: user, project: project_2)
      end

      context "when time_frame is last_week" do
        let (:time_frame) { "last_week" }

        it "returns the hours_logged for a project in the last week" do
          from, to = client.week_month_year(time_frame)
          result = [project_1, project_2].map { | project | { name: project.name, team: project.project_member_full_names, minutes_spent: project.timesheet_entries.where(work_date: from..to).sum(:duration) } }
          expect(client.project_details(time_frame)).to eq(result)
        end
      end

      context "when time_frame is week" do
        let (:time_frame) { "week" }

        it "returns the hours_logged for a project in that week" do
          from, to = client.week_month_year(time_frame)
          result = [project_1, project_2].map { | project | { name: project.name, team: project.project_member_full_names, minutes_spent: project.timesheet_entries.where(work_date: from..to).sum(:duration) } }
          expect(client.project_details(time_frame)).to eq(result)
        end
      end

      context "when time_frame is month" do
        let (:time_frame) { "month" }

        it "returns the hours_logged for a project in that month" do
          from, to = client.week_month_year(time_frame)
          result = [project_1, project_2].map { | project | { name: project.name, team: project.project_member_full_names, minutes_spent: project.timesheet_entries.where(work_date: from..to).sum(:duration) } }
          expect(client.project_details(time_frame)).to eq(result)
        end
      end

      context "when time_frame is year" do
        let (:time_frame) { "year" }

        it "returns the hours_logged for a project in that year" do
          from, to = client.week_month_year(time_frame)
          result = [project_1, project_2].map { | project | { name: project.name, team: project.project_member_full_names, minutes_spent: project.timesheet_entries.where(work_date: from..to).sum(:duration) } }
          expect(client.project_details(time_frame)).to eq(result)
        end
      end
    end
  end
end
