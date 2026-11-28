# frozen_string_literal: true

require "rails_helper"
require "timeout"
require Rails.root.join("db/migrate/20261111100000_create_payroll_consultant_invoices")
require Rails.root.join("db/migrate/20261111110000_preserve_consultant_invoice_delivery_reviews")

RSpec.describe "Consultant invoice rollback versus committed evidence" do
  self.use_transactional_tests = false
  include_context "committed consultant invoice"

  CREATION_VERSION = 20_261_111_100_000
  REVIEW_VERSION = 20_261_111_110_000
  REMITTANCE_VERSION = 20_261_112_010_000

  before(:context) do
    @migration_context = ActiveRecord::Base.connection_pool.migration_context
    @restore_remittance = @migration_context.get_all_versions.include?(REMITTANCE_VERSION)
    if @restore_remittance
      ActiveRecord::Base.connection.execute("TRUNCATE payroll_remittance_documents")
      @migration_context.run(:down, REMITTANCE_VERSION)
    end
  end

  after do
    connection = ActiveRecord::Base.connection
    CreatePayrollConsultantInvoices.new.up unless connection.table_exists?(:payroll_invoice_preparations)
    PreserveConsultantInvoiceDeliveryReviews.new.up unless connection.column_exists?(:payroll_consultant_invoice_deliveries, :reconciled_by_id)
    [CREATION_VERSION, REVIEW_VERSION].each do |version|
      @migration_context.schema_migration.create_version(version.to_s) unless @migration_context.get_all_versions.include?(version)
    end
    connection.schema_cache.clear!
    [PayrollInvoicePreparation, PayrollConsultantInvoice, PayrollConsultantInvoiceDelivery].each(&:reset_column_information)
  end

  after(:context) do
    @migration_context.run(:up, REMITTANCE_VERSION) if @restore_remittance
  end

  def migrate_down(kind, mode)
    klass, version = kind == :preparation ? [CreatePayrollConsultantInvoices, CREATION_VERSION] : [PreserveConsultantInvoiceDeliveryReviews, REVIEW_VERSION]
    if mode == :direct
      migration = klass.new
      migration.safety_assured { migration.down }
    else
      @migration_context.run(:down, version)
    end
  end

  def race_down(kind, mode, sql, values)
    ready, commit, backend, outcome, committed = Queue.new, Queue.new, Queue.new, Queue.new, Queue.new
    config = ActiveRecord::Base.connection_db_config.configuration_hash
    writer = Thread.new do
      PG.connect(host: config[:host], port: config[:port], dbname: config[:database],
        user: config[:username] || config[:user], password: config[:password]) do |pg|
        pg.exec("BEGIN")
        pg.exec_params(sql, values)
        ready << true
        commit.pop
        pg.exec("COMMIT")
        committed << true
      end
    rescue StandardError => error
      ready << error
      committed << error
    end
    expect(Timeout.timeout(15) { ready.pop }).to be(true)
    rollback = Thread.new do
      ActiveRecord::Base.connection_pool.with_connection do |connection|
        backend << connection.select_value("SELECT pg_backend_pid()")
        migrate_down(kind, mode)
        outcome << nil
      rescue StandardError => error
        outcome << error
      end
    end
    pid = Timeout.timeout(15) { backend.pop }
    waited_query = Timeout.timeout(15) do
      loop do
        row = ActiveRecord::Base.connection.select_one("SELECT wait_event_type, query FROM pg_stat_activity WHERE pid = #{Integer(pid)}")
        break row.fetch("query") if row&.fetch("wait_event_type") == "Lock"
        sleep 0.01
      end
    end
    commit << true
    Timeout.timeout(15) { writer.join; rollback.join }
    error = outcome.pop
    expect(committed.pop).to be(true)
    connection = ActiveRecord::Base.connection
    retained = if kind == :preparation
      connection.table_exists?(:payroll_invoice_preparations) &&
        connection.select_value("SELECT EXISTS(SELECT 1 FROM payroll_invoice_preparations WHERE idempotency_key='rollback-race')")
    else
      connection.column_exists?(:payroll_consultant_invoice_deliveries, :reconciled_by_id) &&
        connection.select_value("SELECT EXISTS(SELECT 1 FROM payroll_consultant_invoice_deliveries WHERE reconciled_by_id IS NOT NULL)")
    end
    puts "Invoice rollback #{kind}/#{mode} waited on #{waited_query}; writer committed; evidence_retained=#{retained}; rollback=#{error&.class || 'completed'}"
    aggregate_failures do
      expect(retained).to be(true)
      expect(error.is_a?(ActiveRecord::IrreversibleMigration) || error&.cause.is_a?(ActiveRecord::IrreversibleMigration)).to be(true)
    end
  ensure
    commit << true if commit
    writer&.join(15)
    rollback&.join(15)
  end

  [:direct, :migrator].each do |mode|
    it "preserves a preparation committed while #{mode} rollback waits" do
      current = revision
      facts = PayrollInvoicePreparation.type_for_attribute("facts").serialize(invoice_facts)
      race_down(:preparation, mode, <<~SQL, [company.id, run.id, current.id, employment.id, accounts.id, facts, "a" * 64])
        INSERT INTO payroll_invoice_preparations
          (company_id,payroll_run_id,payroll_revision_id,employment_id,actor_id,facts,command_digest,idempotency_key,created_at,updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'rollback-race',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      SQL
      expect(PayrollInvoicePreparation.find_by!(idempotency_key: "rollback-race").facts).to eq(invoice_facts)
    end

    it "preserves reconciliation evidence committed while #{mode} rollback waits" do
      prepare_consultant_invoice
      grant_invoice_consent
      credited_invoice_leg
      invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
      delivery = invoice.payroll_consultant_invoice_deliveries.sole
      delivery.update!(state: "uncertain")
      evidence = PayrollConsultantInvoiceDelivery.type_for_attribute("reconciliation_evidence").serialize("Synthetic stopped worker evidence")
      race_down(:review, mode, <<~SQL, [accounts.id, evidence, delivery.id])
        UPDATE payroll_consultant_invoice_deliveries SET reconciled_by_id=$1,
          reconciled_at=CURRENT_TIMESTAMP,reconciliation_evidence=$2 WHERE id=$3
      SQL
      expect(delivery.reload.reconciliation_evidence).to eq("Synthetic stopped worker evidence")
      expect(delivery.reconciled_by_id).to eq(accounts.id)
    end

    it "rolls unused invoice metadata down and up through #{mode}" do
      migrate_down(:review, mode)
      migrate_down(:preparation, mode)
      expect(ActiveRecord::Base.connection.table_exists?(:payroll_invoice_preparations)).to be(false)
      CreatePayrollConsultantInvoices.new.up
      PreserveConsultantInvoiceDeliveryReviews.new.up
      columns = ActiveRecord::Base.connection.columns(:payroll_consultant_invoice_deliveries).map(&:name)
      expect(columns).to include("reconciled_by_id", "reconciled_at", "reconciliation_evidence")
    end
  end
end
