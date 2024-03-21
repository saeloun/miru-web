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
  end
end
