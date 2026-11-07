# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Overlapping Mercury status refreshes" do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion, { except: %w[ar_internal_metadata schema_migrations] }
    expect(ActiveRecord::Base.connection.open_transactions).to eq(0)
  end

  include_context "approved mercury consultant payroll"

  around do |example|
    freeze_time { example.run }
  end

  let(:request_url) { "#{mercury_base}/request-send-money/#{request_id}" }
  let(:transactions_url) { %r{#{Regexp.escape(mercury_base)}/account/#{account_id}/transactions} }

  def refresh_status(leg)
    Payroll::MercuryReconciliation.new(PayrollRun.find(run.id)).refresh!(actor: User.find(owner.id), instruction_id: leg.id)
  end

  def overlap_status_reads(leg, phase:, newer_first: true)
    entered = Queue.new
    release = Queue.new
    trace = Queue.new
    stale_request = mercury_request("status" => "pendingApproval")
    approved_request = mercury_request("status" => "approved")
    pending_transaction = mercury_transaction
    sent_transaction = mercury_transaction("status" => "sent")
    block_response = lambda do |stage, response|
      if Thread.current[:stale_mercury_status] && phase == stage
        expect(ActiveRecord::Base.connection.open_transactions).to eq(0)
        observed_state = Digest::SHA256.hexdigest(JSON.generate(PayrollPaymentInstruction.find(leg.id).attributes))
        # Let eight paused HTTP reads share the suite's small database pool.
        ActiveRecord::Base.connection_pool.release_connection
        trace << [Process.clock_gettime(Process::CLOCK_MONOTONIC), "older_#{stage}_read"]
        entered << observed_state
        Timeout.timeout(10) { release.pop }
        trace << [Process.clock_gettime(Process::CLOCK_MONOTONIC), "older_#{stage}_returned"]
      end
      mercury_json(response)
    end
    stub_request(:get, request_url).to_return do
      block_response.call(:request, phase == :request && Thread.current[:stale_mercury_status] ? stale_request : approved_request)
    end
    stub_request(:get, transactions_url).to_return do
      transactions = [Thread.current[:stale_mercury_status] ? pending_transaction : sent_transaction]
      block_response.call(:transactions, { "total" => 1, "transactions" => transactions })
    end

    threads = []
    observed_states = []
    8.times do
      threads << Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          Thread.current[:stale_mercury_status] = true
          refresh_status(leg)
        end
      end
      observed_states << Timeout.timeout(10) { entered.pop }
    end
    expect(observed_states.uniq.size).to eq(1)
    finish_older = lambda do
      8.times { release << true }
      threads.each { |thread| Timeout.timeout(10) { thread.value } }
    end
    finish_older.call unless newer_first
    trace << [Process.clock_gettime(Process::CLOCK_MONOTONIC), "newer_write_started"]
    yield
    trace << [Process.clock_gettime(Process::CLOCK_MONOTONIC), "newer_write_committed"]
    snapshot = leg.reload.attributes
    events = leg.payroll_payment_events.order(:id).pluck(:kind, :data)
    finish_older.call if newer_first
    if newer_first
      expect(leg.reload.attributes).to eq(snapshot)
      expect(leg.payroll_payment_events.order(:id).pluck(:kind, :data)).to eq(events)
    end
  ensure
    8.times { release << true } if release
    threads&.each { |thread| thread.join(12) || thread.kill.join }
    if trace
      entries = []
      entries << trace.pop until trace.empty?
      RSpec.configuration.reporter.message(JSON.generate(phase:, newer_first:, monotonic_trace: entries))
    end
  end

  %i[request transactions].product([true, false]).each do |phase, newer_first|
    it "keeps the newer provider status when older #{phase} responses finish #{newer_first ? 'after' : 'before'} it" do
      leg = accepted_instruction(response: mercury_request("status" => phase == :request ? "pendingApproval" : "approved"))

      overlap_status_reads(leg, phase:, newer_first:) { refresh_status(leg) }

      expect(leg.reload.request_status).to eq("approved")
      expect(leg.transaction_status).to eq("sent")
      expect(leg.held_reason).to be_nil
      expect(leg.payroll_payment_events.where(kind: "request_status_changed").where("data->>'to' = ?", "pendingApproval")).to be_empty
    end
  end

  it "preserves a recorded credit when older transaction reads finish afterward" do
    leg = accepted_instruction(response: mercury_request("status" => "approved"))
    stub_request(:get, request_url).to_return(mercury_json(mercury_request("status" => "approved")))
    stub_request(:get, transactions_url).to_return(mercury_json({ "total" => 1, "transactions" => [mercury_transaction("status" => "sent")] }))
    refresh_status(leg)

    overlap_status_reads(leg, phase: :transactions) do
      Payroll::MercuryReconciliation.new(run).record_credit!(actor: accounts, instruction_id: leg.id, amount: "1000.00",
        credited_on: company.resolved_time_zone.today.iso8601, reference: "SYNTHETIC-CREDIT")
    end

    expect(leg.reload.credited_minor).to eq(100_000)
    expect(leg.credit_state).to eq("partial")
    expect(leg.held_reason).to be_nil
    expect(leg.payroll_payment_events.where(kind: "credit_recorded").count).to eq(1)
  end
end
