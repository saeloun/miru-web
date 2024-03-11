# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::GeneratePdf do
  let(:report_data) { double("report_data") }
  let(:current_company) { double("current_company") }

  describe "#process" do
    context "when report type is time_entries" do
      subject { described_class.new(:time_entries, report_data, current_company) }

      it "generates PDF for time entries" do
        allow(Pdf::HtmlGenerator).to receive(:new).with(
          :time_entries,
          locals: { report_data:, current_company: }).and_return(double("Pdf::HtmlGenerator", make: nil))
        subject.process
      end
    end

    context "when report type is accounts_aging" do
      subject { described_class.new(:accounts_aging, report_data, current_company) }

      it "generates PDF for accounts aging" do
        allow(Pdf::HtmlGenerator).to receive(:new).with(
          :accounts_aging,
          locals: { report_data:, current_company: }).and_return(double("Pdf::HtmlGenerator", make: nil))
        subject.process
      end
    end

    context "when report type is unsupported" do
      it "raises ArgumentError" do
        expect {
          described_class.new(:unsupported_report_type, report_data, current_company).process
        }.to raise_error(ArgumentError, "Unsupported report type: unsupported_report_type")
      end
    end
  end
end
