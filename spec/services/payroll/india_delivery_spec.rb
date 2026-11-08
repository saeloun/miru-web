# frozen_string_literal: true

require "rails_helper"

RSpec.describe Payroll::IndiaDelivery do
  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end

  include_context "approved mercury consultant payroll"
  include_context "hiring SMTP transport"

  before do
    ConsultantCompensation.create!(employment:, created_by: owner, effective_on: Date.new(2026, 11, 1), monthly_fee: 62_500,
      hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Synthetic India", change_reason: "India funding")
    ActionMailer::Base.deliveries.clear
    allow(PayrollIndiaMailer).to receive(:report).and_wrap_original do |original, *args|
      original.call(*args).tap do |delivery|
        delivery.message.delivery_method(:test)
        delivery.message.perform_deliveries = true
      end
    end
  end

  let(:revision) { approve_revision }
  let(:handoff) do
    Payroll::IndiaHandoff.new(run).create!(actor: owner, employment_id: employment.id, expected_digest: revision.digest,
      accounts_email: "accounts@example.test", bank_confirmed: true)
  end
  let(:attempt) { handoff.payroll_india_deliveries.sole }

  it "commits the claim before transport and sends duplicate jobs only once" do
    id = attempt.id
    seen = []
    allow(PayrollIndiaMailer).to receive(:report).and_wrap_original do |original, *args|
      original.call(*args).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
        allow(mail).to receive(:deliver_now).and_wrap_original do |send_mail|
          seen << [PayrollIndiaDelivery.connection.transaction_open?, PayrollIndiaDelivery.find(id).state]
          PayrollIndiaDeliveryJob.perform_now(id)
          send_mail.call
        end
      end
    end
    2.times { PayrollIndiaDeliveryJob.perform_now(id) }
    expect(seen).to eq([[false, "sending"]])
    expect(attempt.reload).to have_attributes(state: "sent", error_code: nil)
    expect(ActionMailer::Base.deliveries.size).to eq(1)
  end

  it "rechecks current authorization after rendering and immediately before dispatch" do
    id = attempt.id
    allow(PayrollIndiaMailer).to receive(:report).and_wrap_original do |original, *args|
      original.call(*args).tap do |mail|
        mail.message.perform_deliveries = true
        owner.remove_role(:owner, company)
      end
    end
    PayrollIndiaDeliveryJob.perform_now(id)
    expect(attempt.reload.state).to eq("failed")
    expect(attempt.error_code).to be_present
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "allows only one concurrent worker to dispatch the same attempt" do
    id = attempt.id
    entered, resume = Queue.new, Queue.new
    allow(PayrollIndiaMailer).to receive(:report).and_wrap_original do |original, *args|
      original.call(*args).tap do |mail|
        mail.message.delivery_method(:test)
        mail.message.perform_deliveries = true
        allow(mail).to receive(:deliver_now).and_wrap_original do |send_mail|
          entered << true
          resume.pop
          send_mail.call
        end
      end
    end
    worker = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection { PayrollIndiaDeliveryJob.perform_now(id) }
    end
    Timeout.timeout(5) do
      entered.pop
      PayrollIndiaDeliveryJob.perform_now(id)
      expect(ActionMailer::Base.deliveries).to be_empty
      resume << true
      worker.value
    end
    expect(attempt.reload.state).to eq("sent")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
  ensure
    resume << true if resume
    worker&.join(5)
  end

  it "records disabled transport as definitely unsent" do
    allow(PayrollIndiaMailer).to receive(:report).and_wrap_original do |original, *args|
      original.call(*args).tap { |mail| mail.message.perform_deliveries = false }
    end
    PayrollIndiaDeliveryJob.perform_now(attempt.id)
    expect(attempt.reload).to have_attributes(state: "failed", error_code: "delivery_disabled")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "logs only safe correlation metadata when the report cannot be constructed" do
    id = attempt.id
    output = StringIO.new
    allow(Rails).to receive(:logger).and_return(ActiveSupport::Logger.new(output))
    allow(PayrollIndiaMailer).to receive(:report).and_raise(ArgumentError, "PRIVATE accounts@example.test 123456789012")
    PayrollIndiaDeliveryJob.perform_now(id)
    expect(attempt.reload).to have_attributes(state: "failed", error_code: "report_unavailable")
    event = JSON.parse(output.string.lines.find { |line| line.include?("payroll_india_report_unavailable") })
    expect(event).to eq("event" => "payroll_india_report_unavailable", "run_id" => run.id, "handoff_id" => handoff.id,
      "delivery_id" => id, "error_class" => "ArgumentError")
    expect(output.string).not_to include("PRIVATE", "accounts@example.test", "123456789012")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "marks stale sending uncertain without retrying or accepting a late result" do
    attempt.update!(state: "sending", started_at: 20.minutes.ago)
    2.times { PayrollIndiaDeliveryJob.perform_now(attempt.id) }
    expect(attempt.reload).to have_attributes(state: "uncertain", error_code: "interrupted")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "does not overwrite recovery or reconciliation when an old worker returns" do
    id = attempt.id
    allow(PayrollIndiaMailer).to receive(:report).and_wrap_original do |original, *args|
      original.call(*args).tap do |mail|
        mail.message.perform_deliveries = true
        allow(mail).to receive(:deliver_now) do
          travel 16.minutes do
            PayrollIndiaDeliveryJob.perform_now(id)
          end
        end
      end
    end
    PayrollIndiaDeliveryJob.perform_now(id)
    expect(attempt.reload).to have_attributes(state: "uncertain", error_code: "interrupted", sent_at: nil)
  end

  it "records only documented inactive-recipient rejection as definitely unsent" do
    allow(PayrollIndiaMailer).to receive(:report).and_wrap_original do |original, *args|
      original.call(*args).tap do |mail|
        mail.message.perform_deliveries = true
        allow(mail).to receive(:deliver_now).and_raise(Postmark::InactiveRecipientError, "PRIVATE accounts@example.test")
      end
    end
    PayrollIndiaDeliveryJob.perform_now(attempt.id)
    expect(attempt.reload).to have_attributes(state: "failed", error_code: "transport_rejected")
  end

  it "holds every other dispatched error uncertain and records no private error text" do
    allow(PayrollIndiaMailer).to receive(:report).and_wrap_original do |original, *args|
      original.call(*args).tap do |mail|
        mail.message.perform_deliveries = true
        allow(mail).to receive(:deliver_now).and_raise(StandardError, "PRIVATE accounts@example.test 123456789012")
      end
    end
    2.times { PayrollIndiaDeliveryJob.perform_now(attempt.id) }
    expect(attempt.reload).to have_attributes(state: "uncertain", error_code: "transport_unknown")
    expect(attempt.attributes.to_json).not_to include("PRIVATE", "accounts@example.test", "123456789012")
  end

  it "recovers queued intent with an ID-only job and never auto retries an uncertain attempt" do
    attempt
    clear_enqueued_jobs
    PayrollIndiaRecoveryJob.perform_now
    expect(PayrollIndiaDeliveryJob).to have_been_enqueued.with(attempt.id)
    attempt.update!(state: "sending", started_at: 20.minutes.ago)
    clear_enqueued_jobs
    PayrollIndiaRecoveryJob.perform_now
    expect(PayrollIndiaDeliveryJob).to have_been_enqueued.with(attempt.id)
    PayrollIndiaDeliveryJob.perform_now(attempt.id)
    clear_enqueued_jobs
    PayrollIndiaRecoveryJob.perform_now
    expect(PayrollIndiaDeliveryJob).not_to have_been_enqueued
  end

  [221, 550].each do |quit_status|
    it "uses real local SMTP with QUIT #{quit_status} and preserves acceptance ambiguity" do
      id = attempt.id
      with_smtp_response(quit_status:) do |commands, messages, port|
        allow(PayrollIndiaMailer).to receive(:report).and_wrap_original do |original, *args|
          original.call(*args).tap do |mail|
            mail.message.delivery_method(:smtp, address: "127.0.0.1", port:, domain: "localhost",
              enable_starttls: false, enable_starttls_auto: false, open_timeout: 2, read_timeout: 2)
            mail.message.perform_deliveries = true
          end
        end
        2.times { PayrollIndiaDeliveryJob.perform_now(id) }
        expect(commands).to include("DATA", "QUIT")
        expect(messages.size).to eq(1)
        received = Mail.read_from_string(messages.sole)
        expect(received.to).to eq(["accounts@example.test"])
        expect(received.text_part.body.decoded).to include("123456789012", "SYNT0000001")
        expect(received.message_id).to eq("payroll-india-#{id}@miru")
        expect(attempt.reload.state).to eq(quit_status == 221 ? "sent" : "uncertain")
      end
    end
  end

  it "executes durable Solid Queue intent through local SMTP with only an ID in queue storage" do
    revision
    original_adapter = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :solid_queue
    id = attempt.id
    job = SolidQueue::Job.where(class_name: "PayrollIndiaDeliveryJob").sole
    expect(job.arguments.fetch("arguments")).to eq([id])
    expect(job.arguments.to_json).not_to include("accounts@example.test", "123456789012")
    worker_process = SolidQueue::Process.register(kind: "Worker", name: "synthetic-india-mail", pid: Process.pid, hostname: "localhost")
    with_smtp_response do |_commands, messages, port|
      allow(PayrollIndiaMailer).to receive(:report).and_wrap_original do |original, *args|
        original.call(*args).tap do |mail|
          mail.message.delivery_method(:smtp, address: "127.0.0.1", port:, domain: "localhost",
            enable_starttls: false, enable_starttls_auto: false, open_timeout: 2, read_timeout: 2)
          mail.message.perform_deliveries = true
        end
      end
      claimed = SolidQueue::ReadyExecution.claim(["default"], 1, worker_process.id).sole
      claimed.perform
      expect(attempt.reload.state).to eq("sent")
      expect(messages.size).to eq(1)
      expect(SolidQueue::FailedExecution.count).to eq(0)
      expect(job.reload.finished_at).to be_present
    end
  ensure
    ActiveJob::Base.queue_adapter = original_adapter if original_adapter
    worker_process&.deregister
  end
end
