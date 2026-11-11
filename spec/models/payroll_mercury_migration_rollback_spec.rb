# frozen_string_literal: true

require "rails_helper"
require Rails.root.join("db/migrate/20261103090000_create_payroll_mercury_payments")
require Rails.root.join("db/migrate/20261108120000_create_payroll_india_handoffs")

RSpec.describe "Historical Mercury DDL rollback with current PTO guards" do
  TABLES = %w[payroll_payment_events payroll_payment_instructions payroll_payment_groups payroll_mercury_recipient_links
    payroll_mercury_connections payroll_split_arrangements payroll_expense_reservations].freeze
  VERSION = 20_261_103_090_000
  FIRST_PTO_VERSION = 20_261_108_200_000
  EMPLOYMENT_TENANT_INDEX_VERSION = 20_261_107_092_900
  INVOICE_VERSIONS = [20_261_111_100_000, 20_261_111_110_000].freeze
  INVOICE_TABLES = %w[payroll_invoice_preparations payroll_consultant_invoices payroll_consultant_invoice_deliveries].freeze

  before(:context) do
    @migration_context = ActiveRecord::Base.connection_pool.migration_context
    @original_versions = @migration_context.get_all_versions.sort
    @original_pto_schema = pto_schema_snapshot
    @original_invoice_dependencies = invoice_dependencies_snapshot
    @rewound_versions = []
    DatabaseCleaner.clean_with :truncation, except: %w[ar_internal_metadata schema_migrations]
    # Unwind invoice children before their historical parents; retain independent PTO guards.
    @original_versions.reverse_each do |version|
      next unless (version > VERSION && version < FIRST_PTO_VERSION) || INVOICE_VERSIONS.include?(version)
      next if version == EMPLOYMENT_TENANT_INDEX_VERSION # Five current PTO foreign keys depend on this shared index.

      @migration_context.run(:down, version)
      @rewound_versions << version
    end
    # Current payroll guards require India records even while Mercury DDL is tested historically.
    ActiveRecord::Base.connection.transaction do
      CreatePayrollIndiaHandoffs.new.up
      @created_india_tables = true
    end
  end

  after(:context) do
    begin
      CreatePayrollIndiaHandoffs.new.down if @created_india_tables && ActiveRecord::Base.connection.table_exists?(:payroll_india_handoffs)
    ensure
      Array(@rewound_versions).sort.each { |version| @migration_context.run(:up, version) }
    end
    expect(@migration_context.get_all_versions.sort).to eq(@original_versions)
    expect(pto_schema_snapshot).to eq(@original_pto_schema)
    expect(invoice_dependencies_snapshot).to eq(@original_invoice_dependencies)
    expect([ConsultantPtoPolicy, PayrollPtoEntry, PayrollPtoAllocation, PayrollPtoRecovery, PayrollPtoNotification].map(&:count)).to eq([0] * 5)
    puts "Historical Mercury fixture restored #{@original_versions.size} versions; PTO #{@original_pto_schema[:functions].size} functions/#{@original_pto_schema[:triggers].size} triggers unchanged"
  end

  before do
    DatabaseCleaner.clean
    DatabaseCleaner.strategy = :deletion
    DatabaseCleaner.start
  end
  include_context "approved mercury consultant payroll"

  def draft_revision
    @draft_revision ||= workflow.revise!(actor: accounts, payload: synthetic_payload,
      idempotency_key: SecureRandom.uuid, expected_digest: nil)
  end

  def group
    @group ||= PayrollPaymentGroup.create!(company:, payroll_run: run, payroll_revision: draft_revision, employment:,
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
        payroll_revision: draft_revision, employment:, amount_minor: 100)
    end
  end

  def pto_schema_snapshot
    connection = ActiveRecord::Base.connection
    {
      functions: connection.select_rows("SELECT proname, pg_get_functiondef(oid) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND (proname = 'protect_payroll_pto_history' OR proname LIKE 'validate_payroll_pto_%') ORDER BY proname"),
      triggers: connection.select_rows("SELECT c.relname, t.tgname, pg_get_triggerdef(t.oid) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid WHERE NOT t.tgisinternal AND (c.relname = 'consultant_pto_policies' OR c.relname LIKE 'payroll_pto_%') ORDER BY c.relname, t.tgname"),
      employment_index: connection.select_value("SELECT pg_get_indexdef('index_employments_hiring_tenant_identity'::regclass)"),
      foreign_keys: connection.select_rows("SELECT conrelid::regclass::text, conname, pg_get_constraintdef(oid), convalidated FROM pg_constraint WHERE contype = 'f' AND (conrelid::regclass::text = 'consultant_pto_policies' OR conrelid::regclass::text LIKE 'payroll_pto_%') ORDER BY 1, 2")
    }
  end

  def snapshot(tables = TABLES)
    connection = ActiveRecord::Base.connection
    tables.index_with do |table|
      {
        rows: connection.select_rows("SELECT * FROM #{connection.quote_table_name(table)} ORDER BY id"),
        columns: connection.columns(table).map { |column| [column.name, column.sql_type, column.null, column.default] },
        indexes: connection.select_rows("SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = current_schema() AND tablename = #{connection.quote(table)} ORDER BY indexname"),
        index_metadata: connection.indexes(table).map { |index| [index.name, index.unique, index.columns, index.where.present?] }.sort_by(&:first),
        constraints: connection.select_rows("SELECT conname, pg_get_constraintdef(oid), convalidated FROM pg_constraint WHERE conrelid = #{connection.quote(table)}::regclass ORDER BY conname"),
        triggers: connection.select_rows("SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid = #{connection.quote(table)}::regclass AND NOT tgisinternal ORDER BY tgname"),
        trigger_functions: connection.select_rows("SELECT t.tgname, pg_get_functiondef(t.tgfoid) FROM pg_trigger t WHERE t.tgrelid = #{connection.quote(table)}::regclass AND NOT t.tgisinternal ORDER BY t.tgname")
      }
    end
  end

  def invoice_dependencies_snapshot
    # schema.rb and migration-up deparse equivalent CHECK/index casts differently.
    snapshot(INVOICE_TABLES).transform_values do |definition|
      definition.slice(:rows, :columns, :index_metadata, :triggers, :trigger_functions).merge(
        checks: definition.fetch(:constraints).filter_map { |name, sql, validated| [name, validated] if sql.start_with?("CHECK") },
        foreign_keys: definition.fetch(:constraints).select { |_name, sql, _validated| sql.start_with?("FOREIGN KEY") })
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
    triggers = ActiveRecord::Base.connection.select_values("SELECT tgname FROM pg_trigger WHERE tgrelid = 'payroll_india_credits'::regclass AND NOT tgisinternal")
    expect(triggers).to eq(["payroll_india_credits_immutable"])
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
