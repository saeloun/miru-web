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
end
