# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::TimeEntries::GeneratePdf do
  let!(:entry) { create(:timesheet_entry) }
  let(:company) { create(:company) }

  describe "#process" do
    subject { described_class.new([{ label: "", entries: [entry] }], company).process }

    it "returns PDF data" do
      expect(subject).to include("PDF")
    end
  end
end
