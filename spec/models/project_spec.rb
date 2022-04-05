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
        from, to = project.week_month_year(time_frame)
        result = [ {
          id: project_member.user_id, name: project_member.full_name,
          hourly_rate: project_member.hourly_rate, minutes_logged: (
            project_member.timesheet_entries.where(project_id: project_member.project_id, work_date: from..to)
          ).sum(:duration)
        } ]
        expect(project.project_team_member_details(time_frame)).to eq(result)
      end
    end

    context "when time_frame is week" do
      let(:time_frame) { "week" }

      it "returns the project_team_member_details for a project in a week" do
        from, to = project.week_month_year(time_frame)
        result = [ {
          id: project_member.user_id, name: project_member.full_name,
          hourly_rate: project_member.hourly_rate, minutes_logged: (
            project_member.timesheet_entries.where(project_id: project_member.project_id, work_date: from..to)
          ).sum(:duration)
        } ]
        expect(project.project_team_member_details(time_frame)).to eq(result)
      end
    end

    context "when time_frame is month" do
      let(:time_frame) { "month" }

      it "returns the project_team_member_details for a project in a month" do
        from, to = project.week_month_year(time_frame)
        result = [ {
          id: project_member.user_id, name: project_member.full_name,
          hourly_rate: project_member.hourly_rate, minutes_logged: (
            project_member.timesheet_entries.where(project_id: project_member.project_id, work_date: from..to)
          ).sum(:duration)
        } ]
        expect(project.project_team_member_details(time_frame)).to eq(result)
      end
    end

    context "when time_frame is year" do
      let(:time_frame) { "year" }

      it "returns the project_team_member_details for a project in a year" do
        from, to = project.week_month_year(time_frame)
        result = [ {
          id: project_member.user_id, name: project_member.full_name,
          hourly_rate: project_member.hourly_rate, minutes_logged: (
            project_member.timesheet_entries.where(project_id: project_member.project_id, work_date: from..to)
          ).sum(:duration)
        } ]
        expect(project.project_team_member_details(time_frame)).to eq(result)
      end
    end
  end
end
