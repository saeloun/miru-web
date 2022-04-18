# frozen_string_literal: true

require "rails_helper"

RSpec.describe Client, type: :model do
  subject { build(:client) }

  describe "Validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_uniqueness_of(:email).scoped_to(:company_id) }
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
      let(:company) { create(:company) }
      let(:user) { create(:user) }
      let(:client) { create(:client, company:) }
      let(:project_1) { create(:project, client:) }
      let(:project_2) { create(:project, client:) }

      before do
        create_list(:timesheet_entry, 5, user:, project: project_1)
        create_list(:timesheet_entry, 5, user:, project: project_2)
      end

      context "when time_frame is last week" do
        let(:time_frame) { "last_week" }

        it "returns the total hours logged for a client in the last week" do
          from, to = client.week_month_year(time_frame)
          result = ([project_1, project_2].map { |project|
            project.timesheet_entries.where(work_date: from..to).sum(:duration)
          }).sum
          expect(client.total_hours_logged(time_frame)).to eq(result)
        end
      end

      context "when time_frame in a week" do
        let(:time_frame) { "week" }

        it "returns the total hours logged for a client in that week" do
          from, to = client.week_month_year(time_frame)
          result = ([project_1, project_2].map { |project|
            project.timesheet_entries.where(work_date: from..to).sum(:duration)
          }).sum
          expect(client.total_hours_logged(time_frame)).to eq(result)
        end
      end

      context "when time_frame in a month" do
        let(:time_frame) { "month" }

        it "returns the total hours logged for a client in that month" do
          from, to = client.week_month_year(time_frame)
          result = ([project_1, project_2].map { |project|
            project.timesheet_entries.where(work_date: from..to).sum(:duration)
          }).sum
          expect(client.total_hours_logged(time_frame)).to eq(result)
        end
      end

      context "when time_frame in a year" do
        let(:time_frame) { "year" }

        it "returns the total hours logged for a client in that year" do
          from, to = client.week_month_year(time_frame)
          result = ([project_1, project_2].map { |project|
            project.timesheet_entries.where(work_date: from..to).sum(:duration)
          }).sum
          expect(client.total_hours_logged(time_frame)).to eq(result)
        end
      end
    end

    describe "#project_details" do
      let(:company) { create(:company) }
      let(:user) { create(:user) }
      let(:client) { create(:client, company:) }
      let(:project_1) { create(:project, client:) }
      let(:project_2) { create(:project, client:) }

      before do
        create_list(:timesheet_entry, 5, user:, project: project_1)
        create_list(:timesheet_entry, 5, user:, project: project_2)
      end

      context "when time_frame is last_week" do
        let(:time_frame) { "last_week" }

        it "returns the hours_logged for a project in the last week" do
          from, to = client.week_month_year(time_frame)
          result = [project_1, project_2].map do | project |
            {
              name: project.name, team: project.project_member_full_names,
              minutes_spent: project.timesheet_entries.where(work_date: from..to).sum(:duration)
            }
          end
          expect(client.project_details(time_frame)).to eq(result)
        end
      end

      context "when time_frame is week" do
        let(:time_frame) { "week" }

        it "returns the hours_logged for a project in that week" do
          from, to = client.week_month_year(time_frame)
          result = [project_1, project_2].map do | project |
            {
              name: project.name, team: project.project_member_full_names,
              minutes_spent: project.timesheet_entries.where(work_date: from..to).sum(:duration)
            }
          end
          expect(client.project_details(time_frame)).to eq(result)
        end
      end

      context "when time_frame is month" do
        let(:time_frame) { "month" }

        it "returns the hours_logged for a project in that month" do
          from, to = client.week_month_year(time_frame)
          result = [project_1, project_2].map do | project |
            {
              name: project.name, team: project.project_member_full_names,
              minutes_spent: project.timesheet_entries.where(work_date: from..to).sum(:duration)
            }
          end
          expect(client.project_details(time_frame)).to eq(result)
        end
      end

      context "when time_frame is year" do
        let(:time_frame) { "year" }

        it "returns the hours_logged for a project in that year" do
          from, to = client.week_month_year(time_frame)
          result = [project_1, project_2].map do | project |
            {
              name: project.name, team: project.project_member_full_names,
              minutes_spent: project.timesheet_entries.where(work_date: from..to).sum(:duration)
            }
          end
          expect(client.project_details(time_frame)).to eq(result)
        end
      end
    end

    describe "#new_line_item_entries" do
      let(:company) { create(:company) }
      let(:user) { create(:user) }
      let(:client) { create(:client, company:) }
      let(:project) { create(:project, client:) }
      let(:project_member) { create(:project_member, project:, user:, hourly_rate: 5000) }

      before do
        create_list(:timesheet_entry, 5, user:, project:)
      end

      context "when no entries are selected" do
        let(:selected_entries) { [] }

        it "returns all the line item entries" do
          result =
            client.timesheet_entries.where(bill_status: :unbilled)
              .joins("INNER JOIN project_members ON timesheet_entries.project_id = project_members.project_id
                  AND timesheet_entries.user_id = project_members.user_id")
              .joins("INNER JOIN users ON project_members.user_id = users.id")
              .select(
                "timesheet_entries.id as id,
                 users.first_name as first_name,
                 users.last_name as last_name,
                 timesheet_entries.work_date as date,
                 timesheet_entries.note as description,
                 project_members.hourly_rate as rate,
                 timesheet_entries.duration as qty"
              ).where.not(id: selected_entries)
          expect(client.new_line_item_entries(selected_entries)).to eq(result)
        end
      end

      context "when some entries are selected" do
        let(:selected_entries) { [ 1, 2 ] }

        it "returns all the line item entries except the entries which are selected" do
          result =
            client.timesheet_entries.where(bill_status: :unbilled)
              .joins("INNER JOIN project_members ON timesheet_entries.project_id = project_members.project_id
                  AND timesheet_entries.user_id = project_members.user_id")
              .joins("INNER JOIN users ON project_members.user_id = users.id")
              .select(
                "timesheet_entries.id as id,
                 users.first_name as first_name,
                 users.last_name as last_name,
                 timesheet_entries.work_date as date,
                 timesheet_entries.note as description,
                 project_members.hourly_rate as rate,
                 timesheet_entries.duration as qty"
              ).where.not(id: selected_entries)
          expect(client.new_line_item_entries(selected_entries)).to eq(result)
        end
      end
    end
  end
end
