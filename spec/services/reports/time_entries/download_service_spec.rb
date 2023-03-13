# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::TimeEntries::DownloadService do
  let(:company) { create(:company) }
  let(:client) { create(:client, :with_logo, company:) }
  let(:project) { create(:project, client:) }

  before do
    create_list(:user, 12)
    User.all.each do | user |
      create(:employment, company:, user:)
      create(:timesheet_entry, project:, user:)
    end
    TimesheetEntry.search_index.refresh
  end

  describe "#process" do
    subject { described_class.new(
      {
        group_by: "team_member",
        format: "csv"
      },
      company)
    }

    it "Fetches all the users data" do
      subject.process
      data = subject.reports
      all_users_with_name = User.all.order(:first_name).map { |u| u.full_name }
      expect(data.pluck(:label)).to eq(all_users_with_name)
    end
  end
end
