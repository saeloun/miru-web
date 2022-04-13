# frozen_string_literal: true

require "rails_helper"
RSpec.describe Project, type: :model do
  let(:project) { build(:project) }

  describe "Associations" do
    it { is_expected.to belong_to(:client) }
    it { is_expected.to have_many(:timesheet_entries) }
    it { is_expected.to have_many(:project_members).dependent(:destroy) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_inclusion_of(:billable).in_array([true, false]) }
  end

  describe "Callbacks" do
    it { is_expected.to callback(:discard_project_members).after(:discard) }
  end

  describe "#project_team_member_details" do
    let(:company) { create(:company) }
    let(:user) { create(:user) }
    let(:client) { create(:client, company:) }
    let(:project) { create(:project, client:) }
    let(:project_member) { create(:project_member, project:, user:, hourly_rate: 5000) }

    before do
      create_list(:timesheet_entry, 5, user:, project:)
    end

    context "when time_frame is last_week" do
      let(:time_frame) { "last_week" }

      it "returns the project_team_member_details for a project in the last week" do
        result = project_members_details(time_frame)
        expect(project.project_team_member_details(time_frame)).to eq(result)
      end
    end

    context "when time_frame is week" do
      let(:time_frame) { "week" }

      it "returns the project_team_member_details for a project in a week" do
        result = project_members_details(time_frame)
        expect(project.project_team_member_details(time_frame)).to eq(result)
      end
    end

    context "when time_frame is month" do
      let(:time_frame) { "month" }

      it "returns the project_team_member_details for a project in a month" do
        result = project_members_details(time_frame)
        expect(project.project_team_member_details(time_frame)).to eq(result)
      end
    end

    context "when time_frame is year" do
      let(:time_frame) { "year" }

      it "returns the project_team_member_details for a project in a year" do
        result = project_members_details(time_frame)
        expect(project.project_team_member_details(time_frame)).to eq(result)
      end
    end

    def project_members_details(time_frame)
      from, to = project.week_month_year(time_frame)
      project_members_timesheet_entries =
        project.timesheet_entries.where(user_id: project.project_members.pluck(:user_id), work_date: from..to)
      project.project_members.map do |project_member|
        minutes_logged = project_members_timesheet_entries.filter_map do |project_members_timesheet_entry|
          project_members_timesheet_entry.duration if project_members_timesheet_entry.user_id == project_member.user_id
        end.sum
        {
          id: project_member.user_id,
          name: project_member.full_name,
          hourly_rate: project_member.hourly_rate,
          minutes_logged:
        }
      end
    end
  end

  describe "#total_hours_logged" do
    let(:company) { create(:company) }
    let(:user) { create(:user) }
    let(:client) { create(:client, company:) }
    let(:project) { create(:project, client:) }
    let(:project_member) { create(:project_member, project:, user:, hourly_rate: 5000) }

    context "when time_frame is last week" do
      let(:time_frame) { "last_week" }
      let(:last_week_day1) { Date.today.last_week + 2.days }
      let(:last_week_day2) { Date.today.last_week + 1.day }
      let(:today) { Date.today }

      it "returns total duration for timesheet entries in last week" do
        timesheet_entry1 = create(:timesheet_entry, user:, project:, duration: 300, work_date: last_week_day1)
        timesheet_entry2 = create(:timesheet_entry, user:, project:, duration: 200, work_date: last_week_day2)
        timesheet_entry3 = create(:timesheet_entry, user:, project:, duration: 400, work_date: today)

        # timesheet_entry3 is excluded since it belongs to current week
        total_duration = timesheet_entry1.duration + timesheet_entry2.duration
        expect(project.total_hours_logged(time_frame)).to eq(total_duration)
      end
    end

    context "when time_frame is week" do
      let(:time_frame) { "week" }
      let(:beginning_of_week) { Date.today.beginning_of_week + 1.day }
      let(:end_of_week) { Date.today.end_of_week - 1.day }
      let(:last_week) { Date.today.end_of_week - 9.days }

      it "returns total duration for timesheet entries in a week" do
        timesheet_entry1 = create(:timesheet_entry, user:, project:, duration: 100, work_date: beginning_of_week)
        timesheet_entry2 = create(:timesheet_entry, user:, project:, duration: 400, work_date: end_of_week)
        timesheet_entry3 = create(:timesheet_entry, user:, project:, duration: 800, work_date: last_week)

        # timesheet_entry3 is excluded since it belongs to last week
        total_duration = timesheet_entry1.duration + timesheet_entry2.duration
        expect(project.total_hours_logged(time_frame)).to eq(total_duration)
      end
    end

    context "when time_frame is month" do
      let(:time_frame) { "month" }
      let(:beginning_of_month) { Date.today.beginning_of_month + 2.days }
      let(:end_of_month) { Date.today.end_of_month - 1.day }
      let(:previous_month) { Date.today.end_of_month - 2.months }

      it "returns total duration for timesheet entries in a month" do
        timesheet_entry1 = create(:timesheet_entry, user:, project:, duration: 700, work_date: beginning_of_month)
        timesheet_entry2 = create(:timesheet_entry, user:, project:, duration: 800, work_date: end_of_month)
        timesheet_entry3 = create(:timesheet_entry, user:, project:, duration: 900, work_date: previous_month)

        # timesheet_entry3 is excluded since it belongs to a month before
        total_duration = timesheet_entry1.duration + timesheet_entry2.duration
        expect(project.total_hours_logged(time_frame)).to eq(total_duration)
      end
    end

    context "when time_frame is year" do
      let(:time_frame) { "year" }
      let(:beginning_of_year) { Date.today.beginning_of_year + 2.days }
      let(:end_of_year) { Date.today.end_of_year - 1.day }
      let(:two_years_back) { Date.today - 2.years }

      it "returns total duration for timesheet entries in a month" do
        timesheet_entry1 = create(:timesheet_entry, user:, project:, duration: 100, work_date: beginning_of_year)
        timesheet_entry2 = create(:timesheet_entry, user:, project:, duration: 400, work_date: end_of_year)
        timesheet_entry3 = create(:timesheet_entry, user:, project:, duration: 200, work_date: two_years_back)
        # timesheet_entry3 is excluded since it's 2 years old
        total_duration = timesheet_entry1.duration + timesheet_entry2.duration
        expect(project.total_hours_logged(time_frame)).to eq(total_duration)
      end
    end

    describe "#discard_project_members" do
      let(:company) { create(:company) }
      let(:user) { create(:user) }
      let(:client) { create(:client, company:) }
      let(:project) { create(:project, client:) }
      let!(:project_member1) { create(:project_member, project:, user:, hourly_rate: 5000) }
      let!(:project_member2) { create(:project_member, project:, user:, hourly_rate: 1000) }

      it "returns empty list of project members when project is discarded" do
        expect(project.project_members.kept.pluck(:id)).to match_array([project_member1.id, project_member2.id])
        project.discard!
        expect(project.reload.project_members.kept.pluck(:id)).to eq([])
      end
    end
  end
end
