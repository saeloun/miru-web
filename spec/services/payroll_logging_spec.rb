# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payroll log privacy" do
  let(:sensitive_value) { "synthetic-payroll-private-value" }

  it "redacts nested payroll payloads from request parameters" do
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    filtered = filter.filter("run" => { "payroll_payload" => { "input" => sensitive_value } })

    expect(filtered.dig("run", "payroll_payload")).to eq("[FILTERED]")
    expect(filtered.to_s).not_to include(sensitive_value)
  end

  it "redacts payroll payloads from model inspection" do
    revision = PayrollRevision.new(payroll_payload: { "input" => sensitive_value })

    expect(revision.inspect).not_to include(sensitive_value)
    expect(revision.inspect).to include("[FILTERED]")
  end

  it "redacts payroll payload binds from SQL logs" do
    output = StringIO.new
    original_logger = ActiveRecord::Base.logger
    ActiveRecord::Base.logger = ActiveSupport::Logger.new(output)

    PayrollRevision.where(payroll_payload: { "input" => sensitive_value }).load

    expect(output.string).to include("payroll_payload")
    expect(output.string).to include("[FILTERED]")
    expect(output.string).not_to include(sensitive_value)
  ensure
    ActiveRecord::Base.logger = original_logger
  end
end
