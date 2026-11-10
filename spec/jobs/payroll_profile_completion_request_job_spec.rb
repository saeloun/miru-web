# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe PayrollProfileCompletionRequestJob do
  def committed(&block)
    Thread.new { ApplicationRecord.connection_pool.with_connection(&block) }.value
  end

  def wait_for_blocker(blocked_pid, blocking_pid)
    Timeout.timeout(10) do
      loop do
        break if ApplicationRecord.connection.select_value("SELECT #{blocking_pid.to_i} = ANY(pg_blocking_pids(#{blocked_pid.to_i}))")
        sleep 0.01
      end
    end
  end

  def request_fixture
    committed do
      company = create(:company)
      enable_synthetic_payroll(company.id)
      owner, accounts, worker = 3.times.map { create(:user, current_workspace: company) }
      [[owner, :owner], [accounts, :book_keeper], [worker, :employee]].each do |user, role|
        user.add_role(role, company)
        create(:employment, company:, user:, joined_at: "2020-01-01", resigned_at: nil)
      end
      employment = company.employments.find_by!(user: worker)
      EmployeeRecord.create!(employment:, private_details: { "bank_name" => "PRIVATE BANK", "bank_account_name" => "PRIVATE HOLDER",
        "bank_country" => "IN", "bank_account_currency" => "INR", "bank_account_number" => "123456789012", "bank_ifsc" => "SYNT0000001" })
      ConsultantCompensation.create!(employment:, created_by: owner, effective_on: "2020-01-01", monthly_fee: "73124.59",
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "mercury_us", legal_entity_name: "Synthetic Entity", change_reason: "Configured")
      run = PayrollRun.create!(company:, period: Date.current.beginning_of_month, currency: "INR", accounts_reviewer: accounts, final_reviewer: owner)
      service = Payroll::ProfileCompletion.new(run, actor: accounts)
      source = service.summary(employment)
      service.create!(employment_id: employment.id.to_s, expected_digest: source.fetch(:source_digest), idempotency_key: SecureRandom.uuid).id
    end
  end

  after do
    DatabaseCleaner.clean
    committed { DatabaseCleaner.clean_with(:truncation, except: %w[ar_internal_metadata schema_migrations]) }
  end

  it "enqueues only a committed ID and sends once under real two-connection lock contention" do
    payloads = []
    subscriber = ActiveSupport::Notifications.subscribe(/action_mailer/) { |event| payloads << event.payload }
    id = request_fixture
    expect(enqueued_jobs.filter_map { |job| job[:args] if job[:job] == described_class }).to eq([[id]])
    entered, release, connections = Queue.new, Queue.new, Queue.new
    allow(PayrollProfileCompletionMailer).to receive(:requested).and_wrap_original do |original, *arguments|
      entered << true
      Timeout.timeout(10) { release.pop }
      original.call(*arguments)
    end
    first = Thread.new do
      ApplicationRecord.connection_pool.with_connection do |connection|
        connections << connection.select_value("SELECT pg_backend_pid()")
        described_class.perform_now(id)
      end
    end
    Timeout.timeout(10) { entered.pop }
    first_pid = connections.pop
    second = Thread.new do
      ApplicationRecord.connection_pool.with_connection do |connection|
        connections << connection.select_value("SELECT pg_backend_pid()")
        described_class.perform_now(id)
      end
    end
    second_pid = connections.pop
    expect(first_pid).not_to eq(second_pid)
    wait_for_blocker(second_pid, first_pid)
    expect(ActionMailer::Base.deliveries).to be_empty
    release << true
    Timeout.timeout(10) { [first, second].each(&:value) }
    expect(committed { PayrollProfileCompletionRequest.find(id).state }).to eq("sent")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
    expect(payloads.to_json).not_to include("PRIVATE BANK", "PRIVATE HOLDER", "123456789012", "73124.59",
      ActionMailer::Base.deliveries.last.to.first, "Submitting details")
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
    release << true if release
    [first, second].compact.each { |thread| thread.kill if thread.alive? }
    [first, second].compact.each(&:join)
  end

  it "commits one new command and enqueue when two connections create the same changed-basis request" do
    original_id = request_fixture
    run_id, employment_id, actor_id, digest = committed do
      request = PayrollProfileCompletionRequest.find(original_id)
      record = request.employment.employee_record
      record.update!(private_details: record.private_details.merge("bank_name" => "PRIVATE UPDATED BANK"))
      source = Payroll::ProfileCompletion.new(request.payroll_run).current_source(request.employment)
      [request.payroll_run_id, request.employment_id, request.requested_by_id, source.fetch(:source_digest)]
    end
    before_count = committed { PayrollProfileCompletionRequest.count }
    clear_enqueued_jobs
    entered, release, connections = Queue.new, Queue.new, Queue.new
    subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |event|
      next unless Thread.current[:profile_creation_gate] && event.payload[:sql].match?(/FROM "payroll_runs".*FOR UPDATE/m)

      Thread.current[:profile_creation_gate] = false
      entered << true
      Timeout.timeout(10) { release.pop }
    end
    key = SecureRandom.uuid
    first = Thread.new do
      ApplicationRecord.connection_pool.with_connection do |connection|
        connections << connection.select_value("SELECT pg_backend_pid()")
        Thread.current[:profile_creation_gate] = true
        Payroll::ProfileCompletion.new(PayrollRun.find(run_id), actor: User.find(actor_id)).create!(
          employment_id: employment_id.to_s, expected_digest: digest, idempotency_key: key).id
      end
    end
    Timeout.timeout(10) { entered.pop }
    first_pid = connections.pop
    second = Thread.new do
      ApplicationRecord.connection_pool.with_connection do |connection|
        connections << connection.select_value("SELECT pg_backend_pid()")
        Payroll::ProfileCompletion.new(PayrollRun.find(run_id), actor: User.find(actor_id)).create!(
          employment_id: employment_id.to_s, expected_digest: digest, idempotency_key: key).id
      end
    end
    second_pid = Timeout.timeout(10) { connections.pop }
    expect(first_pid).not_to eq(second_pid)
    wait_for_blocker(second_pid, first_pid)
    release << true
    ids = Timeout.timeout(10) { [first, second].map(&:value) }
    expect(ids.uniq.size).to eq(1)
    expect(ids.first).not_to eq(original_id)
    expect(committed { PayrollProfileCompletionRequest.count }).to eq(before_count + 1)
    expect(enqueued_jobs.filter_map { |job| job[:args] if job[:job] == described_class }).to eq([[ids.first]])
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
    release << true if release
    [first, second].compact.each { |thread| thread.kill if thread.alive? }
    [first, second].compact.each(&:join)
  end

  it "leaves disabled transport queued until a later real attempt can send" do
    id = request_fixture
    allow(PayrollProfileCompletionMailer).to receive(:perform_deliveries).and_return(false)
    committed { described_class.perform_now(id) }
    expect(committed { PayrollProfileCompletionRequest.find(id).attributes.slice("state", "attempted_at", "sent_at") })
      .to eq("state" => "queued", "attempted_at" => nil, "sent_at" => nil)
    expect(ActionMailer::Base.deliveries).to be_empty
    allow(PayrollProfileCompletionMailer).to receive(:perform_deliveries).and_return(true)
    committed { described_class.perform_now(id) }
    expect(committed { PayrollProfileCompletionRequest.find(id).state }).to eq("sent")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
  end

  it "keeps a failed attempted delivery uncertain without logging private errors or retrying" do
    id = request_fixture
    output = StringIO.new
    allow(Rails).to receive(:logger).and_return(ActiveSupport::Logger.new(output))
    allow(PayrollProfileCompletionMailer).to receive(:requested).and_wrap_original do |original, *arguments|
      mail = original.call(*arguments)
      allow(mail.message.delivery_method).to receive(:deliver!).and_raise(StandardError, "PRIVATE BANK 123456789012")
      mail
    end
    committed { described_class.perform_now(id) }
    expect(committed { PayrollProfileCompletionRequest.find(id).state }).to eq("uncertain")
    committed { described_class.perform_now(id); PayrollProfileCompletionRecoveryJob.perform_now }
    expect(committed { PayrollProfileCompletionRequest.find(id).state }).to eq("uncertain")
    expect(ActionMailer::Base.deliveries).to be_empty
    expect(output.string).not_to include("PRIVATE BANK", "123456789012")
  end

  it "skips the stale combined request after partial completion and sends only the remaining request" do
    id = request_fixture
    replacement = committed do
      request = PayrollProfileCompletionRequest.find(id)
      record = request.employment.employee_record
      record.update!(private_details: record.private_details.merge("bank_swift" => "SYNTINBBXXX"))
      described_class.perform_now(id)
      service = Payroll::ProfileCompletion.new(request.payroll_run, actor: request.requested_by)
      source = service.summary(request.employment)
      expect(source.fetch(:categories)).to eq(["billing_identity"])
      service.create!(employment_id: request.employment_id.to_s, expected_digest: source.fetch(:source_digest), idempotency_key: SecureRandom.uuid).id
    end
    expect(committed { PayrollProfileCompletionRequest.find(id).state }).to eq("skipped")
    expect(ActionMailer::Base.deliveries).to be_empty
    committed { described_class.perform_now(replacement) }
    expect(ActionMailer::Base.deliveries.sole.body.decoded).to include("/settings/billing-identity")
    expect(ActionMailer::Base.deliveries.sole.body.decoded).not_to include("/settings/employee-records")
  end

  it "skips when the recipient is deleted before delivery" do
    id = request_fixture
    committed do
      PayrollProfileCompletionRequest.find(id).recipient.discard!
      described_class.perform_now(id)
    end
    expect(committed { PayrollProfileCompletionRequest.find(id).state }).to eq("skipped")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "skips when the assigned requester loses their accounts role" do
    id = request_fixture
    committed do
      request = PayrollProfileCompletionRequest.find(id)
      request.requested_by.remove_role(:book_keeper, request.company)
      described_class.perform_now(id)
    end
    expect(committed { PayrollProfileCompletionRequest.find(id).state }).to eq("skipped")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "retains committed work after enqueue failure and recovers only aged queued requests with transport enabled" do
    allow(described_class).to receive(:perform_later).and_raise(StandardError, "PRIVATE queue error")
    id = nil
    expect { id = request_fixture }.not_to raise_error
    expect(committed { PayrollProfileCompletionRequest.find(id).state }).to eq("queued")
    allow(described_class).to receive(:perform_later).and_call_original
    clear_enqueued_jobs
    committed { PayrollProfileCompletionRecoveryJob.perform_now }
    expect(enqueued_jobs).to be_empty
    committed { PayrollProfileCompletionRequest.find(id).update!(created_at: 16.minutes.ago) }
    allow(PayrollProfileCompletionMailer).to receive(:perform_deliveries).and_return(false)
    committed { PayrollProfileCompletionRecoveryJob.perform_now }
    expect(enqueued_jobs).to be_empty
    allow(PayrollProfileCompletionMailer).to receive(:perform_deliveries).and_return(true)
    committed { PayrollProfileCompletionRecoveryJob.perform_now }
    expect(enqueued_jobs.filter_map { |job| job[:args] if job[:job] == described_class }).to eq([[id]])
  end

  it "does not overwrite stale sending recovery or automatically resend the uncertain message" do
    id = request_fixture
    allow(PayrollProfileCompletionMailer).to receive(:requested).and_wrap_original do |original, *arguments|
      mail = original.call(*arguments)
      allow(mail.message.delivery_method).to receive(:deliver!).and_wrap_original do |deliver, *values|
        PayrollProfileCompletionRequest.find(id).update!(attempted_at: 16.minutes.ago)
        allow(PayrollProfileCompletionMailer).to receive(:perform_deliveries).and_return(false)
        PayrollProfileCompletionRecoveryJob.perform_now
        deliver.call(*values)
      end
      mail
    end
    committed { described_class.perform_now(id) }
    expect(committed { PayrollProfileCompletionRequest.find(id).state }).to eq("uncertain")
    expect(ActionMailer::Base.deliveries.size).to eq(1)
    committed { described_class.perform_now(id) }
    expect(ActionMailer::Base.deliveries.size).to eq(1)
  end

  it "terminally skips when payroll is disabled before delivery" do
    id = request_fixture
    allow(ENV).to receive(:[]).with("MIRU_PAYROLL_ENABLED").and_return("false")
    committed { described_class.perform_now(id) }
    expect(committed { PayrollProfileCompletionRequest.find(id).state }).to eq("skipped")
    expect(ActionMailer::Base.deliveries).to be_empty
  end
end
