# frozen_string_literal: true

require "rails_helper"

RSpec.describe DateRangeParamParsing do
  subject(:parser) { parser_class.new(params:, company:) }

  let(:company) { instance_double(Company, date_format:) }
  let(:date_format) { "MM-DD-YYYY" }
  let(:params) { {} }
  let(:parser_class) do
    Class.new do
      include DateRangeParamParsing

      attr_reader :params, :current_company

      def initialize(params:, company:)
        @params = ActionController::Parameters.new(params)
        @current_company = company
      end

      def parsed_from
        parsed_date_param(:from)
      end

      def parsed_to
        parsed_date_param(:to)
      end

      def parsed_values
        parsed_date_params
      end
    end
  end

  it "parses ISO date params" do
    params.merge!(from: "2026-04-01", to: "2026-04-30")

    expect(parser.parsed_values).to eq(
      from: Date.new(2026, 4, 1),
      to: Date.new(2026, 4, 30)
    )
  end

  it "respects the current company date format before fallback formats" do
    params.merge!(from: "31-03-2026", to: "30-04-2026")
    allow(company).to receive(:date_format).and_return("DD-MM-YYYY")

    expect(parser.parsed_from).to eq(Date.new(2026, 3, 31))
    expect(parser.parsed_to).to eq(Date.new(2026, 4, 30))
  end

  it "chooses the closest valid ordered pair for ambiguous numeric dates" do
    params.merge!(from: "04-05-2026", to: "05-04-2026")

    expect(parser.parsed_values).to eq(
      from: Date.new(2026, 4, 5),
      to: Date.new(2026, 4, 5)
    )
  end

  it "returns nil for blank or invalid date params" do
    params.merge!(from: "", to: "not-a-date")

    expect(parser.parsed_values).to eq(from: nil, to: nil)
  end
end
