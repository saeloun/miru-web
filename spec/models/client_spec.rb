# frozen_string_literal: true

require "rails_helper"

RSpec.describe Client, type: :model do
  subject { build(:client) }

  describe "Validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email) }
    it { is_expected.to allow_value("valid@email.com").for(:email) }
    it { is_expected.not_to allow_value("invalid@email").for(:email) }
  end

  describe "Associations" do
    it { is_expected.to have_many(:projects) }
    it { is_expected.to have_many(:timesheet_entries) }
    it { is_expected.to belong_to(:company) }
  end

  describe "Public methods" do
    describe "#project_total_hours" do
      let!(:company) { create(:company) }
      let!(:user) { create(:user) }
      let!(:client) { create(:client, company: company) }
      let!(:project_1) { create(:project, client: client) }
      let!(:project_2) { create(:project, client: client) }
      5.times do
        let!(:project_1_timesheet_entry) { create(:timesheet_entry, user: user, project: project_1) }
        let!(:project_2_timesheet_entry) { create(:timesheet_entry, user: user, project: project_2) }
      end
      it "when timeframe is week" do
        from, to = client.week_month_year("week")
        result = ([project_1, project_2].map { |project| project.timesheet_entries.where(work_date: from..to).sum(:duration) }).sum
        expect(client.project_total_hours("week")).to eq(result)
      end
      it "when timeframe is month" do
        from, to = client.week_month_year("month")
        result = ([project_1, project_2].map { |project| project.timesheet_entries.where(work_date: from..to).sum(:duration) }).sum
        expect(client.project_total_hours("month")).to eq(result)
      end
      it "when timeframe is year" do
        from, to = client.week_month_year("year")
        result = ([project_1, project_2].map { |project| project.timesheet_entries.where(work_date: from..to).sum(:duration) }).sum
        expect(client.project_total_hours("year")).to eq(result)
      end
      it "when timeframe is last_week" do
        from, to = client.week_month_year("last_week")
        result = ([project_1, project_2].map { |project| project.timesheet_entries.where(work_date: from..to).sum(:duration) }).sum
        expect(client.project_total_hours("last_week")).to eq(result)
      end
    end

    describe "#hours_logged" do
      let!(:company) { create(:company) }
      let!(:user) { create(:user) }
      let!(:client) { create(:client, company: company) }
      let!(:project_1) { create(:project, client: client) }
      let!(:project_2) { create(:project, client: client) }
      5.times do
        let!(:project_1_timesheet_entry) { create(:timesheet_entry, user: user, project: project_1) }
        let!(:project_2_timesheet_entry) { create(:timesheet_entry, user: user, project: project_2) }
      end
      it "when timeframe is week" do
        from, to = client.week_month_year("week")
        result = [project_1, project_2].map { | project | { "name" => project.name, "team" => project.project_team, "hour_spend" => project.timesheet_entries.where(work_date: from..to).sum(:duration) } }
        expect(client.hours_logged("week")).to eq(result)
      end
      it "when timeframe is month" do
        from, to = client.week_month_year("month")
        result = [project_1, project_2].map { | project | { "name" => project.name, "team" => project.project_team, "hour_spend" => project.timesheet_entries.where(work_date: from..to).sum(:duration) } }
        expect(client.hours_logged("month")).to eq(result)
      end
      it "when timeframe is year" do
        from, to = client.week_month_year("year")
        result = [project_1, project_2].map { | project | { "name" => project.name, "team" => project.project_team, "hour_spend" => project.timesheet_entries.where(work_date: from..to).sum(:duration) } }
        expect(client.hours_logged("year")).to eq(result)
      end
      it "when timeframe is last_week" do
        from, to = client.week_month_year("last_week")
        result = [project_1, project_2].map { | project | { "name" => project.name, "team" => project.project_team,  "hour_spend" => project.timesheet_entries.where(work_date: from..to).sum(:duration) } }
        expect(client.hours_logged("last_week")).to eq(result)
      end
    end
  end
end
