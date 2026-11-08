# frozen_string_literal: true

require "rails_helper"

RSpec.describe Payroll::MercuryStatusRefreshJob do
  include_context "approved mercury consultant payroll"

  let!(:leg) { accepted_instruction }

  before do
    stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(mercury_json(mercury_request("status" => "approved")))
    stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions}).to_return(mercury_json({ "total" => 0, "transactions" => [] }))
    WebMock.reset_executed_requests!
  end

  it "refreshes status with reads only" do
    described_class.perform_now
    expect(leg.reload.request_status).to eq("approved")
    expect(a_request(:post, /mercury/)).not_to have_been_made
  end

  it "discards a stale batch record and advances on the next sweep" do
    changed = false
    allow_any_instance_of(Payroll::MercuryReconciliation).to receive(:refresh_from_job!).and_wrap_original do |original, instruction|
      unless changed
        PayrollPaymentInstruction.find(instruction.id).update!(last_error_code: "provider_status_unavailable", last_checked_at: Time.current)
        changed = true
      end
      original.call(instruction)
    end

    described_class.perform_now
    expect(leg.reload).to have_attributes(request_status: "pendingApproval", last_error_code: nil, credited_minor: 0)

    described_class.perform_now
    expect(leg.reload).to have_attributes(request_status: "approved", last_error_code: nil, credited_minor: 0)
    expect(a_request(:get, "#{mercury_base}/request-send-money/#{request_id}")).to have_been_made.twice
    expect(a_request(:post, /mercury/)).not_to have_been_made
  end

  it "does not touch an unverified connection" do
    PayrollMercuryConnection.find_by!(company:).update!(verified_at: nil, verified_version: nil)
    described_class.perform_now
    expect(a_request(:any, /mercury/)).not_to have_been_made
  end

  it "does not touch a company without the entitlement" do
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_SAELOUN_COMPANY_ID").and_return("0")
    described_class.perform_now
    expect(a_request(:any, /mercury/)).not_to have_been_made
  end

  it "never submits a prepared or uncertain leg" do
    PayrollPaymentInstruction.where(id: leg.id).update_all(submission_state: "uncertain")
    described_class.perform_now
    expect(a_request(:any, /mercury/)).not_to have_been_made
  end

  it "records an unavailable provider without failing the sweep" do
    stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}").to_return(status: 503)
    expect { described_class.perform_now }.not_to raise_error
    expect(leg.reload.last_error_code).to eq("provider_status_unavailable")
    expect(leg.request_status).to eq("pendingApproval")
  end

  it "keeps tracking a sent wire for a late return" do
    PayrollPaymentInstruction.where(id: leg.id).update_all(request_status: "approved", transaction_status: "sent")
    described_class.perform_now
    expect(a_request(:get, %r{/request-send-money/})).to have_been_made.once
  end

  it "reports an unexpected failure and recovers on the next sweep without changing money state" do
    leg.update!(held_reason: "failed_after_sent")
    attempts = 0
    allow_any_instance_of(Payroll::MercuryReconciliation).to receive(:refresh_from_job!).and_wrap_original do |original, instruction|
      attempts += 1
      raise RuntimeError, "synthetic refresh failure" if attempts == 1

      original.call(instruction)
    end
    allow(Rails.error).to receive(:report)
    expect { described_class.perform_now }.not_to raise_error
    expect(leg.reload).to have_attributes(last_error_code: "status_refresh_failed", request_status: "pendingApproval", credited_minor: 0,
      held_reason: "failed_after_sent")
    expect(Rails.error).to have_received(:report).with(have_attributes(message: "Mercury status refresh failed", cause: nil), hash_including(handled: true,
      context: hash_including(company_id: company.id, payroll_payment_instruction_id: leg.id, error_class: "RuntimeError")))
    described_class.perform_now
    expect(leg.reload).to have_attributes(last_error_code: nil, request_status: "approved", credited_minor: 0, held_reason: "failed_after_sent")
    expect(a_request(:post, /mercury/)).not_to have_been_made
  end
end
