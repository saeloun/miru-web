# frozen_string_literal: true

require "spec_helper"
require_relative "../../../app/services/payroll_calculation/reconciliation"

RSpec.describe PayrollCalculation::Reconciliation do
  let(:rows) do
    %w[100 200 300].each_with_index.map do |net, index|
      { "company_id" => "synthetic-company", "period" => "2026-11", "person_id" => "person-#{index}",
        "currency" => "USD", "net" => net, "review_ready" => true }
    end
  end
  let(:ids) { %w[person-0 person-1 person-2] }
  let(:expected) { { "USD" => "600" } }

  def reconcile
    described_class.new.call(results: rows, expected_totals: expected, recipient_ids: ids, company_id: "synthetic-company", period: "2026-11")
  end

  it "reconciles independent totals against the same explicit population" do
    expect(reconcile).to include("totals" => { "USD" => "600.0" }, "reconciled" => true, "preview_only" => true)
  end

  it "rejects truncated totals and truncated detail populations" do
    expected["USD"] = "300"
    expect(reconcile.fetch("issues")).to include("total_mismatch:USD")
    rows.pop
    expect(reconcile.fetch("issues")).to include("recipient_population_mismatch")
  end

  it "rejects duplicate recipients" do
    rows << rows.first.dup
    expect(reconcile.fetch("issues")).to include("duplicate_recipient", "recipient_population_mismatch")
  end

  it "keeps missing net distinct from zero" do
    rows.last["net"] = nil
    expect(reconcile.fetch("issues")).to include("missing_net:person-2", "total_mismatch:USD")
  end

  it "separates currency totals and company-period boundaries" do
    rows.last.merge!("currency" => "INR", "company_id" => "other-company", "period" => "2026-10")
    expect(reconcile.fetch("issues")).to include("currency_population_mismatch", "company_or_period_mismatch")
    expect(reconcile.fetch("totals")).to eq("USD" => "300.0", "INR" => "300.0")
  end

  it "blocks calculations with unresolved review issues" do
    rows.first["review_ready"] = false
    expect(reconcile.fetch("issues")).to include("calculation_requires_review:person-0")
  end
end
