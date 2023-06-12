# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::TimeEntries::GeneratePdf do
  let(:report_entries) { [double("TimeEntry")] }
  let(:current_company) { double("Company") }

  subject { described_class.new(report_entries, current_company) }

  describe "#process" do
    it "generates a PDF report using Pdf::HtmlGenerator" do
      html_generator = instance_double("Pdf::HtmlGenerator")
      allow(Pdf::HtmlGenerator).to receive(:new).and_return(html_generator)

      allow(html_generator).to receive(:make)
      subject.process
    end
  end
end
