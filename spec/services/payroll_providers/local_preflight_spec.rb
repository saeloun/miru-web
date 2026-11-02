# frozen_string_literal: true

require "spec_helper"
require_relative "../../../app/services/payroll_providers/local_preflight"

RSpec.describe PayrollProviders::LocalPreflight do
  let(:now) { Time.utc(2026, 10, 17, 12) }
  let(:balance) do
    {
      provider: "mercury", company_id: 11, currency: "USD", account_reference: "a" * 64,
      environment: "sandbox", available_minor_units: 11_000, fetched_at: now, observed_at: nil
    }
  end
  let(:attributes) do
    {
      balance:, provider: "mercury", company_id: 11, currency: "USD", account_reference: "a" * 64,
      environment: "sandbox", total_minor_units: 10_000, fees_minor_units: 100, reserve_minor_units: 200,
      reviewed_revision_digest: "b" * 64, current_revision_digest: "b" * 64,
      accounts_approved: true, final_approved: true, capabilities_verified: true, recipients_verified: true,
      clock: -> { now }
    }
  end

  def service_attributes(values)
    {
      balance: values[:balance], clock: values[:clock],
      binding: values.slice(:provider, :company_id, :currency, :account_reference, :environment),
      amounts: values.slice(:total_minor_units, :fees_minor_units, :reserve_minor_units),
      review: values.slice(:reviewed_revision_digest, :current_revision_digest, :accounts_approved,
        :final_approved, :capabilities_verified, :recipients_verified)
    }
  end

  def evaluate(**values)
    described_class.call(**service_attributes(values))
  end

  it "reports coverage for manual review without exposing an execution interface" do
    result = evaluate(**attributes)
    expect(result).to eq(status: "ready_for_manual_review", blockers: [], required_minor_units: 10_300,
      available_minor_units: 11_000, currency: "USD", revision_digest: "b" * 64)
    expect(result).to be_frozen
    expect(result[:blockers]).to be_frozen
    expect(result[:currency]).to be_frozen
    expect(result[:revision_digest]).to be_frozen
    expect(described_class.new(**service_attributes(attributes))).not_to respond_to(:execute, :transfer, :send_money, :create_draft)
  end

  { company_id: 22, currency: "INR", account_reference: "c" * 64, environment: "live", provider: "razorpay" }.each do |key, value|
    it "blocks a #{key} mismatch" do
      result = evaluate(**attributes.merge(balance: balance.merge(key => value)))
      expect(result[:status]).to eq("blocked")
      expect(result[:blockers]).to include("balance_binding_mismatch")
    end
  end

  [nil, {}, "untrusted"].each do |value|
    it "blocks missing or malformed balance #{value.inspect}" do
      expect(evaluate(**attributes.merge(balance: value))[:status]).to eq("blocked")
    end
  end

  { total_minor_units: [nil, 0, -1, "100", 1.5], fees_minor_units: [nil, -1, "0"], reserve_minor_units: [nil, -1, 1.5] }.each do |key, values|
    values.each do |value|
      it "blocks invalid #{key} #{value.inspect}" do
        result = evaluate(**attributes.merge(key => value))
        expect(result[:blockers]).to include("invalid_required_amounts")
        expect(result[:required_minor_units]).to be_nil
      end
    end
  end

  it "includes fees and reserve in the available-balance comparison" do
    result = evaluate(**attributes.merge(balance: balance.merge(available_minor_units: 10_299)))
    expect(result[:blockers]).to include("insufficient_balance")
  end

  it "accepts exact coverage including fees and reserve" do
    result = evaluate(**attributes.merge(balance: balance.merge(available_minor_units: 10_300)))
    expect(result[:status]).to eq("ready_for_manual_review")
  end

  [nil, -1, "11000", 11000.0].each do |amount|
    it "blocks invalid available minor units #{amount.inspect}" do
      result = evaluate(**attributes.merge(balance: balance.merge(available_minor_units: amount)))
      expect(result[:blockers]).to include("invalid_available_balance")
    end
  end

  [-301, 31, nil, "2026-10-17"].each do |offset|
    it "blocks stale or invalid fetched time #{offset.inspect}" do
      fetched_at = offset.is_a?(Integer) ? now + offset : offset
      result = evaluate(**attributes.merge(balance: balance.merge(fetched_at:)))
      expect(result[:blockers]).to include("balance_stale_or_invalid")
    end
  end

  [-301, 31, "2026-10-17"].each do |offset|
    it "blocks stale or invalid provider observation #{offset.inspect}" do
      observed_at = offset.is_a?(Integer) ? now + offset : offset
      result = evaluate(**attributes.merge(balance: balance.merge(observed_at:)))
      expect(result[:blockers]).to include("balance_stale_or_invalid")
    end
  end

  it "requires Razorpay's provider observation timestamp" do
    values = { provider: "razorpay", currency: "INR", environment: "live" }
    result = evaluate(**attributes.merge(values).merge(balance: balance.merge(values)))
    expect(result[:blockers]).to include("balance_stale_or_invalid")
  end

  it "blocks a provider observation later than its fetching window" do
    result = evaluate(**attributes.merge(balance: balance.merge(fetched_at: now - 100, observed_at: now)))
    expect(result[:blockers]).to include("balance_stale_or_invalid")
  end

  [:accounts_approved, :final_approved, :capabilities_verified, :recipients_verified].each do |key|
    [nil, false, "true", 1].each do |value|
      it "blocks #{key} unless explicitly verified #{value.inspect}" do
        expect(evaluate(**attributes.merge(key => value))[:status]).to eq("blocked")
      end
    end
  end

  [nil, "", "c" * 64].each do |digest|
    it "invalidates review when the current revision changes #{digest.inspect}" do
      result = evaluate(**attributes.merge(current_revision_digest: digest))
      expect(result[:blockers]).to include("revision_not_reviewed")
    end
  end

  it "rejects invalid expected account references even when balance matches" do
    result = evaluate(**attributes.merge(account_reference: "raw-account", balance: balance.merge(account_reference: "raw-account")))
    expect(result[:blockers]).to include("invalid_expected_binding")
  end

  it "makes no provider requests when computing the local display result" do
    WebMock.disable_net_connect!
    evaluate(**attributes)
    expect(a_request(:any, /mercury|razorpay/)).not_to have_been_made
  end
end
