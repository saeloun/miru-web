# frozen_string_literal: true

require "rails_helper"
require Rails.root.join("db/migrate/20261103090000_create_payroll_mercury_payments")
require Rails.root.join("db/migrate/20261108120000_create_payroll_india_handoffs")

RSpec.describe "Mercury payroll migration rollback" do
  TABLES = %w[payroll_payment_events payroll_payment_instructions payroll_payment_groups payroll_mercury_recipient_links
    payroll_mercury_connections payroll_split_arrangements payroll_expense_reservations].freeze
  VERSION = 20_261_103_090_000

  before(:context) do
    @original_version = ActiveRecord::Base.connection_pool.migration_context.current_version
    ActiveRecord::Base.connection_pool.migration_context.migrate(VERSION)
    # Current payroll guards require India records even while Mercury DDL is tested historically.
    CreatePayrollIndiaHandoffs.new.up
  end

  after(:context) do
    CreatePayrollIndiaHandoffs.new.down if ActiveRecord::Base.connection.table_exists?(:payroll_india_handoffs)
    ActiveRecord::Base.connection_pool.migration_context.migrate(@original_version)
  end

  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end
  include_context "approved mercury consultant payroll"

  def group
    @group ||= PayrollPaymentGroup.create!(company:, payroll_run: run, payroll_revision: approve_revision, employment:,
      line_digest: "a" * 64, entitlement_minor: 100, required_legs: 1)
  end

  def recipient
    @recipient ||= PayrollMercuryRecipientLink.create!(company:, employment:, verified_by: owner, beneficiary: "consultant",
      mercury_recipient_id: recipient_id, recipient_digest: "a" * 64, bank_details_digest: "b" * 64,
      display_name: "Synthetic recipient", account_mask: "0012", swift_code: "SYNTINBBXXX")
  end

  def instruction
    @instruction ||= PayrollPaymentInstruction.create!(company:, payroll_payment_group: group, payroll_run: run,
      payroll_revision: group.payroll_revision, employment:, consultant_compensation: employment.consultant_compensations.last,
      recipient_link: recipient, prepared_by: owner, beneficiary: "consultant", connection_version: 1, environment: "sandbox",
      source_account_id: account_id, revision_digest: group.payroll_revision.digest, bank_details_digest: "b" * 64,
      recipient_digest: "a" * 64, mercury_recipient_id: recipient_id, entitlement_minor: 100, entitlement_currency: "INR",
      reference_rate: "85.50", buffered_rate: "84.00", rate_source: "Synthetic local fixture", rate_mode: "manual",
      rate_entered_by: owner, rate_observed_at: Time.current, rate_valid_until: 1.day.from_now,
      principal_minor: 100, fee_minor: 100, company_debit_minor: 200, charge_type: "ours", purpose_category: "contractor",
      purpose_info: "Synthetic consultant", idempotency_key: SecureRandom.uuid)
  end

  def seed(table)
    case table
    when "payroll_payment_events"
      instruction.payroll_payment_events.create!(kind: "submission_uncertain", actor: owner)
    when "payroll_payment_instructions" then instruction
    when "payroll_payment_groups" then group
    when "payroll_mercury_recipient_links" then recipient
    when "payroll_mercury_connections"
      PayrollMercuryConnection.create!(company:, configured_by: owner, api_token: "synthetic-unused-token", environment: "sandbox",
        source_account_id: account_id, expected_legal_business_name: "Synthetic business")
    when "payroll_split_arrangements"
      PayrollSplitArrangement.create!(company:, employment:, requested_by: owner,
        details: bank_details.slice(*PayrollSplitArrangement::DETAIL_KEYS).merge("bank_country" => "IN"), allocation_kind: "percentage", allocation_value: 10,
        allocated_to: "spouse", remainder_to: "consultant")
    when "payroll_expense_reservations"
      PayrollExpenseReservation.create!(company:, expense: create(:expense, company:, user: worker), payroll_run: run,
        payroll_revision: approve_revision, employment:, amount_minor: 100)
    end
  end

  def snapshot
    connection = ActiveRecord::Base.connection
    TABLES.index_with do |table|
      {
        rows: connection.select_rows("SELECT * FROM #{connection.quote_table_name(table)} ORDER BY id"),
        columns: connection.columns(table).map { |column| [column.name, column.sql_type, column.null, column.default] },
        indexes: connection.select_rows("SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = current_schema() AND tablename = #{connection.quote(table)} ORDER BY indexname"),
        constraints: connection.select_rows("SELECT conname, pg_get_constraintdef(oid), convalidated FROM pg_constraint WHERE conrelid = #{connection.quote(table)}::regclass ORDER BY conname"),
        triggers: connection.select_rows("SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid = #{connection.quote(table)}::regclass AND NOT tgisinternal ORDER BY tgname")
      }
    end
  end

  TABLES.each do |table|
    it "refuses populated #{table} before any DDL and preserves financial evidence" do
      seed(table)
      before = snapshot
      expect { CreatePayrollMercuryPayments.new.down }.to raise_error(ActiveRecord::IrreversibleMigration, /recorded|history/i)
      expect(snapshot).to eq(before)
    ensure
      CreatePayrollMercuryPayments.new.up unless ActiveRecord::Base.connection.table_exists?(TABLES.first)
    end
  end

  it "waits for a concurrent writer and preserves its committed history before any DDL" do
    original = snapshot.transform_values { |definition| definition.except(:rows) }
    ready = Queue.new
    release = Queue.new
    outcome = Queue.new
    writer = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do |connection|
        connection.transaction do
          record = PayrollMercuryConnection.create!(company:, configured_by: owner, api_token: "synthetic-unused-token", environment: "sandbox",
            source_account_id: account_id, expected_legal_business_name: "Synthetic business")
          ready << [connection.select_value("SELECT pg_backend_pid()"), record.id]
          release.pop
        end
      end
    end
    writer_pid, record_id = ready.pop
    migration = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do |connection|
        ready << connection.select_value("SELECT pg_backend_pid()")
        connection.transaction { CreatePayrollMercuryPayments.new.down }
        outcome << nil
      rescue StandardError => error
        outcome << error
      end
    end
    migration_pid = ready.pop
    deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + 5
    blocked = false
    until blocked || Process.clock_gettime(Process::CLOCK_MONOTONIC) >= deadline
      blocked = ActiveRecord::Base.connection.select_value("SELECT #{writer_pid.to_i} = ANY(pg_blocking_pids(#{migration_pid.to_i}))")
      sleep 0.01 unless blocked
    end
    expect(blocked).to be(true)
    expect(ActiveRecord::Base.connection.select_value("SELECT wait_event_type FROM pg_stat_activity WHERE pid = #{migration_pid.to_i}")).to eq("Lock")
    release << true
    writer.join
    migration.join
    expect(outcome.pop).to be_a(ActiveRecord::IrreversibleMigration)
    expect(PayrollMercuryConnection.find(record_id).expected_legal_business_name).to eq("Synthetic business")
    expect(snapshot.transform_values { |definition| definition.except(:rows) }).to eq(original)
  ensure
    release << true if writer&.alive?
    writer&.join
    migration&.join
    CreatePayrollMercuryPayments.new.up unless ActiveRecord::Base.connection.table_exists?(TABLES.first)
  end

  it "supports an empty rollback and reapplication at the migration's historical version" do
    # schema.rb can deparse equivalent CHECK casts differently from the original migration.
    CreatePayrollMercuryPayments.new.down
    CreatePayrollMercuryPayments.new.up
    before = snapshot
    CreatePayrollMercuryPayments.new.down
    expect(TABLES.any? { |table| ActiveRecord::Base.connection.table_exists?(table) }).to be(false)
    CreatePayrollMercuryPayments.new.up
    expect(snapshot).to eq(before)
  ensure
    CreatePayrollMercuryPayments.new.up unless ActiveRecord::Base.connection.table_exists?(TABLES.first)
  end
end
