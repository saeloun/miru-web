# frozen_string_literal: true

require "rails_helper"

RSpec.describe Reports::GenerateCsv do
  describe "#process" do
    let(:headers) { ["Name", "Age", "Email"] }
    let(:data) do
      [
        ["John Doe", "30", "john@example.com"],
        ["Jane Smith", "25", "jane@example.com"]
      ]
    end

    subject { described_class.new(data, headers) }

    it "generates CSV data with headers and data" do
      csv_data = subject.process
      parsed_csv = CSV.parse(csv_data)

      expect(parsed_csv.first).to eq(headers)

      expect(parsed_csv[1]).to eq(data.first)
      expect(parsed_csv[2]).to eq(data.second)
    end

    it "neutralizes spreadsheet formulas" do
      csv_data = described_class.new([["=1+1", "+cmd", "-2", "@sum", "\tvalue", "\nvalue"]], ["=header"]).process

      expect(CSV.parse(csv_data)).to eq([
        ["'=header"],
        ["'=1+1", "'+cmd", "'-2", "'@sum", "'\tvalue", "'\nvalue"]
      ])
    end
  end
end
