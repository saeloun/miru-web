# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::GenerateCsv do
  let(:company) { create(:company) }
  let!(:entry) { create(:timesheet_entry) }

  describe "#process" do
    before do
      TimesheetEntry.reindex
    end

    subject { described_class.new(TimesheetEntry.search(load: false), company).process }

    let(:csv_headers) do
      "Project,Client,Note,Team Member,Date,Hours Logged"
    end
    let(:csv_data) do
      "#{entry.project_name}," \
        "#{entry.client_name}," \
        "#{entry.note}," \
        "#{entry.user_full_name}," \
        "#{entry.formatted_work_date}," \
        "#{entry.formatted_duration}"
    end

    it "returns CSV string" do
      expect(subject).to include(csv_headers)
      expect(subject).to include(csv_data)
    end
  end
end
