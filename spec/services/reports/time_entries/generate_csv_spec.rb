# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::TimeEntries::GenerateCsv do
  let!(:entry) { create(:timesheet_entry) }

  describe "#process" do
    subject { described_class.new([entry]).process }

    let(:csv_headers) do
      "Project,Client,Note,Team Member,Date,Hours Logged"
    end
    let(:csv_data) do
      "#{entry.project_name}," \
        "#{entry.client_name}," \
        "#{entry.note}," \
        "#{entry.user_full_name}," \
        "#{entry.work_date.strftime("%Y-%m-%d")}," \
        "#{entry.formatted_duration}"
    end

    it "returns CSV string" do
      expect(subject).to include(csv_headers)
      expect(subject).to include(csv_data)
    end
  end
end
