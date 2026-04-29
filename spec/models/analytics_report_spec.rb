# frozen_string_literal: true

require "rails_helper"

RSpec.describe AnalyticsReport, type: :model do
  subject(:analytics_report) { build(:analytics_report) }

  it "is valid with supported report type and filters hash" do
    expect(analytics_report).to be_valid
  end

  it "allows empty filters hash" do
    analytics_report.filters = {}

    expect(analytics_report).to be_valid
  end

  it "requires a valid report type" do
    expect {
      analytics_report.report_type = :unknown
    }.to raise_error(ArgumentError)
  end

  it "rejects non-object filters" do
    analytics_report.filters = []

    expect(analytics_report).not_to be_valid
    expect(analytics_report.errors[:filters]).to include("must be a JSON object")
  end

  it "belongs to a creator" do
    expect(analytics_report.creator).to be_present
  end
end
