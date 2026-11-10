# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Legacy Mercury instruction submission" do
  include_context "reviewed mercury consultant payroll"

  let(:write_url) { "#{mercury_base}/account/#{account_id}/request-send-money" }
  let(:bank_details) do
    { "bank_account_name" => "Synthetic Consultant", "bank_account_number" => "123456789012",
      "bank_ifsc" => "SYNT0000001", "bank_swift" => "SYNTINBBXXX" }
  end

  # Creates pre-upgrade records with the old completeness rule, restoring current guards before use.
  def legacy_instruction(accepted: false)
    RSpec::Mocks.with_temporary_scope do
      allow(Payroll::MercurySetup).to receive(:bank_profile_complete?) do |details|
        %w[bank_account_name bank_account_number bank_ifsc bank_swift].all? { |field| details[field].present? }
      end
      accepted ? accepted_instruction : prepared_instruction
    end
  end

  it "blocks a first submission with an intact old bank digest but incomplete current declarations" do
    instruction = legacy_instruction
    details = Payroll::MercurySetup.bank_details(employment.reload)
    expect(details).to eq(bank_details)
    expect(Payroll::MercurySetup.bank_profile_complete?(details)).to be(false)
    expect(Payroll::MercurySetup.digest(details.sort.to_h)).to eq(instruction.bank_details_digest)
    expect(instruction).to be_intact
    expect(instruction.submission_state).to eq("prepared")
    expect(instruction.rate_valid_until).to be > Time.current
    expect(workflow.status).to eq("approved")
    stub_mercury_reads
    stub_mercury_write

    error = nil
    begin
      Payroll::MercuryPayment.new(run).submit!(actor: owner, instruction_id: instruction.id, expected_digest: instruction.frozen_digest)
    rescue Payroll::MercuryPayment::Blocked => failure
      error = failure
    end

    expect(a_request(:post, write_url)).not_to have_been_made
    expect(error&.codes).to include("bank_profile_incomplete")
    expect(instruction.reload).to have_attributes(submission_state: "prepared", submission_attempts: 0)
  end

  it "still refreshes and credits an accepted legacy payment exactly once" do
    instruction = legacy_instruction(accepted: true)
    expect(Payroll::MercurySetup.bank_profile_complete?(Payroll::MercurySetup.bank_details(employment))).to be(false)
    stub_request(:get, "#{mercury_base}/request-send-money/#{request_id}")
      .to_return(mercury_json(mercury_request("status" => "approved")))
    stub_request(:get, %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions})
      .to_return(mercury_json({ "total" => 1, "transactions" => [mercury_transaction("status" => "sent")] }))
    reconciliation = Payroll::MercuryReconciliation.new(run)

    expect(reconciliation.refresh!(actor: owner, instruction_id: instruction.id).transaction_status).to eq("sent")
    2.times do
      reconciliation.record_credit!(actor: accounts, instruction_id: instruction.id, amount: "62500.00",
        credited_on: company.resolved_time_zone.today.iso8601, reference: "Synthetic legacy credit")
    end

    expect(instruction.reload).to have_attributes(submission_state: "accepted", credited_minor: 6_250_000, credit_state: "credited")
    expect(instruction.payroll_payment_events.where(kind: "credit_recorded").count).to eq(1)
    expect(instruction.payroll_payment_group.reload.fully_credited_at).to be_present
    expect(a_request(:post, write_url)).to have_been_made.once
  end
end
