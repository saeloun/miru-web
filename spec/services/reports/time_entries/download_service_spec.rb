# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::TimeEntries::DownloadService do
  let(:company) { create(:company) }
  let(:client) { create(:client, :with_logo, company:) }
  let(:project) { create(:project, client:) }
  let(:csv_headers) do
    "Project,Client,Note,Team Member,Date,Hours Logged"
  end
  let(:report_entries) { [double("TimeEntry")] }

  before do
    create_list(:user, 12)
    User.all.each do | user |
      create(:employment, company:, user:)
      create(:timesheet_entry, project:, user:)
    end
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

    it "generates CSV report" do
      data = subject.process
      expect(data).to include(csv_headers)
    end

    it "generates a PDF report using Pdf::HtmlGenerator" do
      subject { described_class.new(report_entries, current_company) }

      html_generator = instance_double("Pdf::HtmlGenerator")
      allow(Pdf::HtmlGenerator).to receive(:new).and_return(html_generator)

      allow(html_generator).to receive(:make)
      subject.process
    end
  end
end
