# frozen_string_literal: true

class CreatePayrollConsultantInvoices < ActiveRecord::Migration[8.0]
  def up
    create_table :payroll_invoice_preparations do |t|
      t.references :company, :payroll_run, :payroll_revision, :employment, null: false, foreign_key: true
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.references :previous_preparation, foreign_key: { to_table: :payroll_invoice_preparations }, index: { unique: true }
      t.references :original_blob, foreign_key: { to_table: :active_storage_blobs }
      t.boolean :reviewed, null: false, default: false
      t.text :facts, null: false
      t.string :command_digest, :idempotency_key, null: false
      t.string :state, null: false, default: "waiting_credit"
      t.string :claim_token, :error_code
      t.datetime :started_at, :next_attempt_at
      t.timestamps
    end
    add_index :payroll_invoice_preparations, [:company_id, :payroll_run_id, :employment_id, :id], unique: true, name: "invoice_preparation_tenant_identity"
    add_index :payroll_invoice_preparations, [:payroll_run_id, :employment_id, :idempotency_key], unique: true, name: "invoice_preparation_command"
    add_index :payroll_invoice_preparations, [:payroll_run_id, :employment_id], unique: true,
      where: "previous_preparation_id IS NULL", name: "invoice_preparation_root"
    add_index :payroll_invoice_preparations, [:state, :next_attempt_at]
    add_check_constraint :payroll_invoice_preparations,
      "state IN ('waiting_credit','blocked','queued','generating','failed','completed') AND command_digest ~ '^[0-9a-f]{64}$' AND length(idempotency_key) BETWEEN 1 AND 128", name: "invoice_preparation_values"

    create_table :payroll_consultant_invoices do |t|
      t.references :company, :payroll_run, :payroll_revision, :employment, null: false, foreign_key: true
      t.bigint :preparation_id, null: false
      t.references :issuer, null: false, foreign_key: { to_table: :users }
      t.references :authorization, foreign_key: { to_table: :consultant_invoice_authorizations }
      t.references :payroll_payment_group, :payroll_india_handoff, foreign_key: true
      t.references :pdf_blob, null: false, foreign_key: { to_table: :active_storage_blobs }
      t.references :original_blob, foreign_key: { to_table: :active_storage_blobs }
      t.text :snapshot, null: false
      t.string :financial_year, :number_digest, :mode, null: false
      t.date :issued_on, null: false
      t.datetime :created_at, null: false
    end
    add_index :payroll_consultant_invoices, [:company_id, :payroll_run_id, :employment_id], unique: true, name: "consultant_invoice_one_settlement"
    add_index :payroll_consultant_invoices, [:company_id, :issuer_id, :financial_year, :number_digest], unique: true, name: "consultant_invoice_issuer_number"
    add_check_constraint :payroll_consultant_invoices,
      "num_nonnulls(payroll_payment_group_id,payroll_india_handoff_id)=1 AND number_digest ~ '^[0-9a-f]{64}$' AND financial_year ~ '^[0-9]{4}-[0-9]{4}$' AND ((mode='generate' AND authorization_id IS NOT NULL AND original_blob_id IS NULL) OR (mode='existing' AND authorization_id IS NULL AND original_blob_id IS NOT NULL))", name: "consultant_invoice_source"
    safety_assured do
      add_foreign_key :payroll_consultant_invoices, :payroll_invoice_preparations,
        column: [:company_id, :payroll_run_id, :employment_id, :preparation_id],
        primary_key: [:company_id, :payroll_run_id, :employment_id, :id], name: "consultant_invoice_preparation_tenant"
    end

    create_table :payroll_consultant_invoice_deliveries do |t|
      t.references :payroll_consultant_invoice, null: false, foreign_key: true, index: { name: "invoice_delivery_invoice" }
      t.integer :attempt_number, null: false
      t.string :state, null: false, default: "queued"
      t.string :claim_token, :error_code
      t.datetime :started_at, :sent_at, :reviewed_at
      t.references :reviewed_by, foreign_key: { to_table: :users }
      t.text :review_evidence
      t.timestamps
    end
    add_index :payroll_consultant_invoice_deliveries, [:payroll_consultant_invoice_id, :attempt_number], unique: true, name: "invoice_delivery_attempt"
    add_index :payroll_consultant_invoice_deliveries, :payroll_consultant_invoice_id, unique: true,
      where: "state IN ('queued','sending','uncertain')", name: "invoice_delivery_one_open"
    add_check_constraint :payroll_consultant_invoice_deliveries,
      "attempt_number>0 AND state IN ('queued','sending','sent','failed','uncertain')", name: "invoice_delivery_values"

    safety_assured do
      execute <<~SQL
        CREATE FUNCTION public.protect_consultant_invoice() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'Consultant invoice is immutable'; END; $$;
        CREATE TRIGGER consultant_invoice_immutable BEFORE UPDATE OR DELETE ON payroll_consultant_invoices
          FOR EACH ROW EXECUTE FUNCTION public.protect_consultant_invoice();
        CREATE FUNCTION public.protect_invoice_preparation() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Invoice preparation is retained'; END IF;
          IF (to_jsonb(NEW)-ARRAY['state','claim_token','error_code','started_at','next_attempt_at','updated_at']) <>
             (to_jsonb(OLD)-ARRAY['state','claim_token','error_code','started_at','next_attempt_at','updated_at']) THEN
            RAISE EXCEPTION 'Reviewed invoice preparation facts are immutable';
          END IF;
          RETURN NEW;
        END; $$;
        CREATE TRIGGER invoice_preparation_immutable BEFORE UPDATE OR DELETE ON payroll_invoice_preparations
          FOR EACH ROW EXECUTE FUNCTION public.protect_invoice_preparation();
        CREATE FUNCTION public.protect_consultant_invoice_delivery() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF TG_OP='DELETE' OR NEW.payroll_consultant_invoice_id IS DISTINCT FROM OLD.payroll_consultant_invoice_id OR
            NEW.attempt_number IS DISTINCT FROM OLD.attempt_number OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Consultant invoice delivery identity is immutable';
          END IF;
          RETURN NEW;
        END; $$;
        CREATE TRIGGER consultant_invoice_delivery_immutable BEFORE UPDATE OR DELETE ON payroll_consultant_invoice_deliveries
          FOR EACH ROW EXECUTE FUNCTION public.protect_consultant_invoice_delivery();
      SQL
    end
  end

  def down
    if select_value("SELECT EXISTS(SELECT 1 FROM payroll_invoice_preparations)")
      raise ActiveRecord::IrreversibleMigration, "Preserve consultant invoice records"
    end
    drop_table :payroll_consultant_invoice_deliveries
    drop_table :payroll_consultant_invoices
    drop_table :payroll_invoice_preparations
    safety_assured do
      execute "DROP FUNCTION IF EXISTS public.protect_consultant_invoice()"
      execute "DROP FUNCTION IF EXISTS public.protect_invoice_preparation()"
      execute "DROP FUNCTION IF EXISTS public.protect_consultant_invoice_delivery()"
    end
  end
end
