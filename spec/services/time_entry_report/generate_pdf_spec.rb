# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeEntryReport::GeneratePdf do
  let!(:entry) { create(:timesheet_entry) }

  describe "#process" do
    subject { described_class.new([{ label: "", entries: [entry] }]).process }

    it "returns PDF data" do
      expect(subject).to include("PDF")
    end
  end
end
