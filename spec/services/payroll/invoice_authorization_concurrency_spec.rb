# frozen_string_literal: true

require "rails_helper"
require "timeout"

RSpec.describe "Invoice authorization serialization" do
  def committed(&block)
    Thread.new { ActiveRecord::Base.connection_pool.with_connection(&block) }.value
  end

  def race
    ready, release = Queue.new, Queue.new
    threads = 2.times.map do |index|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          ready << true
          release.pop
          yield index
        end
      end
    end
    Timeout.timeout(10) do
      2.times { ready.pop }
      2.times { release << true }
      threads.map(&:value)
    end
  ensure
    threads&.each { |thread| thread.kill if thread.alive? }
    threads&.each(&:join)
  end

  def fixture
    committed do
      company = create(:company)
      enable_synthetic_payroll(company.id)
      person = create(:user, current_workspace: company)
      employment = create(:employment, company:, user: person, joined_at: "2020-01-01", resigned_at: nil)
      ConsultantCompensation.create!(employment:, created_by: person, effective_on: Date.current.beginning_of_month, monthly_fee: 100_000,
        hours_per_day: 8, weekdays: [1, 2, 3, 4, 5], payment_source: "india", legal_entity_name: "Synthetic entity", change_reason: "Configured")
      [employment.id, person.id]
    end
  end

  def service(ids)
    Payroll::InvoiceAuthorization.new(Employment.find(ids.first), actor: User.find(ids.last))
  end

  after do
    DatabaseCleaner.clean
    committed { DatabaseCleaner.clean_with(:truncation, except: %w[ar_internal_metadata schema_migrations]) }
  end

  it "returns one receipt for concurrent identical retries and refuses competing stale withdrawal" do
    ids = fixture
    statement = committed { service(ids).summary[:statement] }
    input = { action: "grant", expected_event_id: "", statement_digest: statement[:digest], idempotency_key: "same-grant" }
    receipts = race { service(ids).record!(**input).dig(:recorded_event, :id) }
    expect(receipts.uniq.size).to eq(1)
    outcomes = race do |index|
      service(ids).record!(action: "withdraw", expected_event_id: receipts.first, statement_digest: "", idempotency_key: "withdraw-#{index}")[:status]
    rescue Payroll::Workflow::Conflict
      "conflict"
    end
    expect(outcomes).to contain_exactly("withdrawn", "conflict")
    expect(committed { ConsultantInvoiceAuthorization.where(employment_id: ids.first).count }).to eq(2)
  end

  it "serializes withdrawal with a future consumer holding the employment lock" do
    ids = fixture
    granted = committed do
      domain = service(ids)
      domain.record!(action: "grant", expected_event_id: "", statement_digest: domain.summary.dig(:statement, :digest), idempotency_key: "grant")
    end
    worker = nil
    committed do
      employment = Employment.find(ids.first)
      employment.with_lock do
        consumer = Payroll::InvoiceAuthorization.new(employment)
        expect(consumer.authorized?).to be(true)
        expect(consumer.receipt.id.to_s).to eq(granted.dig(:current_event, :id))
        ready = Queue.new
        worker = Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do |connection|
            ready << connection.select_value("SELECT pg_backend_pid()")
            service(ids).record!(action: "withdraw", expected_event_id: granted.dig(:current_event, :id), statement_digest: "", idempotency_key: "withdraw")
          end
        end
        Timeout.timeout(5) do
          pid = ready.pop
          sleep 0.01 until ApplicationRecord.connection.select_value("SELECT pg_backend_pid()=ANY(pg_blocking_pids(#{Integer(pid)}))")
        end
        expect(consumer.authorized?).to be(true)
      end
    end
    expect(Timeout.timeout(5) { worker.value }[:status]).to eq("withdrawn")
    expect(committed { service(ids).authorized? }).to be(false)
  ensure
    worker&.kill if worker&.alive?
    worker&.join
  end
end
