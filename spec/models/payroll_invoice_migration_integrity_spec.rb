# frozen_string_literal: true

require "rails_helper"
require "timeout"
require Rails.root.join("db/migrate/20261111110000_preserve_consultant_invoice_delivery_reviews")
require Rails.root.join("db/migrate/20261112010000_create_payroll_remittance_documents")

RSpec.describe "Payroll invoice migration integrity" do
  self.use_transactional_tests = false
  include_context "committed consultant invoice"

  let(:review_version) { 20_261_111_110_000 }
  let(:remittance_version) { 20_261_112_010_000 }

  def migration_context
    ActiveRecord::Base.connection_pool.migration_context
  end

  def remittance_migration(direction, mode)
    if mode == :direct
      migration = CreatePayrollRemittanceDocuments.new
      migration.safety_assured { migration.public_send(direction) }
    else
      migration_context.run(direction, remittance_version)
    end
  end

  after do
    connection = ActiveRecord::Base.connection
    unless connection.table_exists?(:payroll_remittance_documents)
      migration = CreatePayrollRemittanceDocuments.new
      migration.safety_assured { migration.up }
    end
    unless migration_context.get_all_versions.include?(remittance_version)
      migration_context.schema_migration.create_version(remittance_version.to_s)
    end
    unless migration_context.get_all_versions.include?(review_version)
      migration = PreserveConsultantInvoiceDeliveryReviews.new
      migration.safety_assured { migration.down } if connection.column_exists?(:payroll_consultant_invoice_deliveries, :reconciled_by_id)
      migration_context.run(:up, review_version)
    end
    connection.schema_cache.clear!
    [PayrollRemittanceDocument, PayrollConsultantInvoiceDelivery].each(&:reset_column_information)
  end

  def delivery_definition
    connection = ActiveRecord::Base.connection
    {
      columns: connection.columns(:payroll_consultant_invoice_deliveries).map { |column| [column.name, column.sql_type, column.null, column.default] },
      indexes: connection.select_rows(<<~SQL),
        SELECT indexname, indexdef FROM pg_indexes
        WHERE schemaname='public' AND tablename='payroll_consultant_invoice_deliveries' ORDER BY indexname
      SQL
      constraints: connection.select_rows(<<~SQL),
        SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
        WHERE conrelid='payroll_consultant_invoice_deliveries'::regclass ORDER BY conname
      SQL
      trigger_function: connection.select_value("SELECT pg_get_functiondef('public.protect_consultant_invoice_delivery()'::regprocedure)")
    }
  end

  def insert_invoice(attributes)
    columns = attributes.keys.map { |name| ActiveRecord::Base.connection.quote_column_name(name) }.join(",")
    placeholders = attributes.keys.each_index.map { |index| "$#{index + 1}" }.join(",")
    ActiveRecord::Base.connection.raw_connection.exec_params(
      "INSERT INTO payroll_consultant_invoices (#{columns}) VALUES (#{placeholders})", attributes.values)
  end

  it "rejects a different revision with otherwise identical valid invoice and preparation facts" do
    prepare_consultant_invoice
    grant_invoice_consent
    credited_invoice_leg
    invoice = Payroll::ConsultantInvoiceIssue.new(run, employment_id: employment.id).issue!
    current = invoice.payroll_revision
    other = current.dup
    other.assign_attributes(number: current.number + 1, parent_digest: current.digest, idempotency_key: "revision-control")
    snapshot = Payroll::Snapshot.new(run, other.payroll_payload)
    other.digest = PayrollRevision.chain_digest(snapshot.digest, current.digest, other.number)
    other.save!
    connection = ActiveRecord::Base.connection
    attributes = connection.select_one("SELECT * FROM payroll_consultant_invoices WHERE id=#{Integer(invoice.id)}").except("id")
    connection.execute("TRUNCATE payroll_consultant_invoice_deliveries, payroll_consultant_invoices")
    expect { insert_invoice(attributes) }.to change(PayrollConsultantInvoice, :count).by(1)
    connection.execute("TRUNCATE payroll_consultant_invoice_deliveries, payroll_consultant_invoices")

    expect { insert_invoice(attributes.merge("payroll_revision_id" => other.id)) }.to raise_error(PG::ForeignKeyViolation)
    expect(PayrollConsultantInvoice.count).to eq(0)
  end

  it "rolls back interrupted reconciliation DDL and permits a complete retry" do
    migration_context.run(:down, review_version)
    original = delivery_definition
    RSpec::Mocks.with_temporary_scope do
      allow(ActiveRecord::Base.connection).to receive(:validate_check_constraint).and_wrap_original do |method, *args, **options|
        method.call(*args, **options)
        raise "Synthetic interruption after reconciliation constraints"
      end
      expect { migration_context.run(:up, review_version) }.to raise_error(StandardError, /Synthetic interruption/)
    end
    expect(delivery_definition).to eq(original)
    expect(migration_context.get_all_versions).not_to include(review_version)

    migration_context.run(:up, review_version)
    expect(ActiveRecord::Base.connection.columns(:payroll_consultant_invoice_deliveries).map(&:name))
      .to include("reconciled_by_id", "reconciled_at", "reconciliation_evidence")
    expect(migration_context.get_all_versions).to include(review_version)
  end

  def remittance_document
    worker.update!(current_workspace: company)
    fixture = Rack::Test::UploadedFile.new(Rails.root.join("spec/support/fixtures/pdf-file.pdf"), "application/pdf")
    upload = ActionDispatch::Http::UploadedFile.new(tempfile: fixture.tempfile, filename: "bank-advice.pdf", type: "application/pdf")
    Payroll::RemittanceDocuments.new(credited_invoice_leg, actor: worker).record!(kind: "firc",
      reason: "Synthetic retained bank evidence", expected_document_id: "", idempotency_key: "retention-proof", file: upload)
  end

  [:direct, :migrator].each do |mode|
    it "retains existing remittance evidence and only rolls an empty table down through #{mode}" do
      document = remittance_document
      attributes = document.attributes
      bytes = document.blob.download
      expect { remittance_migration(:down, mode) }.to raise_error(StandardError, /Retain bank remittance evidence/)
      expect(document.reload.attributes).to eq(attributes)
      expect(document.blob.download).to eq(bytes)

      ActiveRecord::Base.connection.execute("TRUNCATE payroll_remittance_documents")
      remittance_migration(:down, mode)
      expect(ActiveRecord::Base.connection.table_exists?(:payroll_remittance_documents)).to be(false)
      remittance_migration(:up, mode)
      expect(ActiveRecord::Base.connection.table_exists?(:payroll_remittance_documents)).to be(true)
    end

    it "retains a remittance writer committed while #{mode} rollback waits" do
      document = remittance_document
      connection = ActiveRecord::Base.connection
      attributes = connection.select_one("SELECT * FROM payroll_remittance_documents WHERE id=#{Integer(document.id)}").except("id")
      connection.execute("TRUNCATE payroll_remittance_documents")
      ready, release, backend, outcome, committed = Queue.new, Queue.new, Queue.new, Queue.new, Queue.new
      writer = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |sql|
          sql.transaction do
            sql.execute("SET LOCAL statement_timeout='10s'")
            pg = sql.raw_connection
            columns = attributes.keys.map { |name| PG::Connection.quote_ident(name) }.join(",")
            placeholders = attributes.keys.each_index.map { |index| "$#{index + 1}" }.join(",")
            pg.exec_params("INSERT INTO payroll_remittance_documents (#{columns}) VALUES (#{placeholders})", attributes.values)
            ready << pg.backend_pid
            release.pop
          end
          committed << true
        end
      rescue StandardError => error
        ready << error
        committed << error
      end
      writer_pid = Timeout.timeout(15) { ready.pop }
      raise writer_pid if writer_pid.is_a?(Exception)

      rollback = Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do |sql|
          sql.execute("SET lock_timeout='10s'")
          backend << sql.select_value("SELECT pg_backend_pid()")
          remittance_migration(:down, mode)
          outcome << nil
        rescue StandardError => error
          outcome << error
        ensure
          sql.execute("RESET lock_timeout")
        end
      end
      rollback_pid = Timeout.timeout(15) { backend.pop }
      waited_query = Timeout.timeout(15) do
        loop do
          row = connection.select_one(<<~SQL)
            SELECT query, #{Integer(writer_pid)} = ANY(pg_blocking_pids(#{Integer(rollback_pid)})) AS blocked_by_writer
            FROM pg_stat_activity WHERE pid=#{Integer(rollback_pid)}
          SQL
          break row.fetch("query") if row && row["blocked_by_writer"] == true
          Thread.pass
        end
      end
      release << true
      Timeout.timeout(15) { writer.join; rollback.join }
      expect(Timeout.timeout(5) { committed.pop }).to be(true)
      error = Timeout.timeout(5) { outcome.pop }
      retained = connection.table_exists?(:payroll_remittance_documents) &&
        connection.select_value("SELECT EXISTS(SELECT 1 FROM payroll_remittance_documents WHERE idempotency_key='retention-proof')")
      puts "Remittance #{mode} rollback waited on #{waited_query}; writer committed; retained=#{retained}; rollback=#{error&.class || 'completed'}"
      expect(retained).to be(true)
      expect(error.is_a?(ActiveRecord::IrreversibleMigration) || error&.cause.is_a?(ActiveRecord::IrreversibleMigration)).to be(true)
    ensure
      release << true if release
      writer&.join(15)
      rollback&.join(15)
    end
  end
end
