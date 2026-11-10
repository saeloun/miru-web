# frozen_string_literal: true

require "rails_helper"

RSpec.describe Payroll::IndiaHandoffReview do
  include_context "reviewed mercury consultant payroll"

  around { |example| travel_to(Time.utc(2026, 12, 5, 12)) { example.run } }

  before do
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 62_500,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: legal_name,
      change_reason: "Synthetic India funding")
    record_synthetic_pto_treatment
    revision = approve_revision
    @service = Payroll::IndiaHandoff.new(run)
    @handoff = @service.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
      accounts_email: "accounts@example.test", bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
    @service.void!(actor: owner, handoff_id: @handoff.id)
    @handoff = @service.create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
      accounts_email: "accounts@example.test", bank_confirmed: true, expected_bank_digest: synthetic_india_bank_digest)
    @handoff.payroll_india_deliveries.sole.update!(state: "failed", error_code: "delivery_disabled")
    @service.retry!(actor: owner, handoff_id: @handoff.id)
    @handoff.payroll_india_deliveries.order(:attempt_number).last.update!(state: "sent", sent_at: Time.current)
  end

  [false, true].each do |credited|
    it "batch-loads ordered attempts and credits for a #{credited ? 'partially credited' : 'delivered'} handoff" do
      if credited
        %w[100 200].each_with_index do |amount, index|
          @service.record_credit!(actor: accounts, handoff_id: @handoff.id, amount:, credited_on: "2026-12-05",
            reference: "SYNTHETIC-REVIEW-#{index}")
        end
      end
      queries = Hash.new(0)
      subscriber = lambda do |_name, _start, _finish, _id, event|
        next if event[:cached] || event[:name] == "SCHEMA"

        %w[payroll_india_deliveries payroll_india_credits].each do |table|
          queries[table] += 1 if event[:sql].include?("FROM \"#{table}\"")
        end
      end
      details = ActiveSupport::Notifications.subscribed(subscriber, "sql.active_record") { described_class.new(run, owner).call }
      history = details.fetch(:consultants).sole.fetch(:handoffs)
      handoff = history.find { |entry| entry[:id] == @handoff.id.to_s }
      expect(queries).to eq("payroll_india_deliveries" => 1, "payroll_india_credits" => 1)
      expect(history.pluck(:status)).to eq(["voided", credited ? "partially_credited" : "awaiting_payment"])
      expect(handoff.fetch(:status)).to eq(credited ? "partially_credited" : "awaiting_payment")
      expect(handoff.fetch(:attempts).pluck(:attempt_number)).to eq([1, 2])
      expect(handoff.fetch(:attempts).pluck(:state)).to eq(%w[failed sent])
      expect(handoff.fetch(:credits).pluck(:amount_minor)).to eq(credited ? %w[10000 20000] : [])
      expect(handoff.dig(:report, :bank)).to include(country: "IN", account_currency: "INR", branch: "Synthetic Branch", swift: "SYNTINBBXXX")
      expect(handoff.to_json).not_to include("123456789012", "SYNTHETIC-REVIEW")
    end
  end
end
