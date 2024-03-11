# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::AccountsAging::DownloadService do
  let(:current_company) { create(:company) }

  describe "#process" do
    let(:params) { { some_param: "value" } }
    let(:reports_data) { { clients: [], total_amount_overdue_by_date_range: {} } }

    subject { described_class.new(params, current_company) }

    before do
      allow(Reports::AccountsAging::FetchOverdueAmount).to receive(:new).and_return(
        double(
          "FetchOverdueAmount",
          process: reports_data))
      allow(Reports::GeneratePdf).to receive(:new).and_return(double("Reports::GeneratePdf", process: nil))
      allow(Reports::GenerateCsv).to receive(:new).and_return(double("Reports::GenerateCsv", process: nil))
    end

    it "fetches complete report, generates PDF and CSV" do
      allow(subject).to receive(:fetch_complete_report)
      allow(subject).to receive(:generate_pdf)
      allow(subject).to receive(:generate_csv)

      subject.process
    end

    it "fetches complete report and generates CSV" do
      allow(subject).to receive(:fetch_complete_report)
      allow(subject).to receive(:generate_csv)

      subject.process
    end
  end
end
