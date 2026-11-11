# frozen_string_literal: true

class PreserveConsultantInvoiceDeliveryReviews < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def up
    add_reference :payroll_consultant_invoice_deliveries, :reconciled_by, index: { algorithm: :concurrently }
    add_foreign_key :payroll_consultant_invoice_deliveries, :users, column: :reconciled_by_id, validate: false
    validate_foreign_key :payroll_consultant_invoice_deliveries, :users, column: :reconciled_by_id
    add_column :payroll_consultant_invoice_deliveries, :reconciled_at, :datetime
    add_column :payroll_consultant_invoice_deliveries, :reconciliation_evidence, :text
    add_check_constraint :payroll_consultant_invoice_deliveries,
      "(reconciled_by_id IS NULL AND reconciled_at IS NULL AND reconciliation_evidence IS NULL) OR " \
      "(reconciled_by_id IS NOT NULL AND reconciled_at IS NOT NULL AND reconciliation_evidence IS NOT NULL)",
      name: "invoice_delivery_reconciliation_complete", validate: false
    validate_check_constraint :payroll_consultant_invoice_deliveries, name: "invoice_delivery_reconciliation_complete"

    safety_assured do
      execute <<~SQL
        CREATE OR REPLACE FUNCTION public.protect_consultant_invoice_delivery() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF TG_OP='DELETE' OR NEW.payroll_consultant_invoice_id IS DISTINCT FROM OLD.payroll_consultant_invoice_id OR
            NEW.attempt_number IS DISTINCT FROM OLD.attempt_number OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Consultant invoice delivery identity is immutable';
          END IF;
          IF (OLD.reviewed_by_id IS NOT NULL OR OLD.reviewed_at IS NOT NULL OR OLD.review_evidence IS NOT NULL) AND
            ROW(NEW.reviewed_by_id, NEW.reviewed_at, NEW.review_evidence) IS DISTINCT FROM
            ROW(OLD.reviewed_by_id, OLD.reviewed_at, OLD.review_evidence) THEN
            RAISE EXCEPTION 'Consultant invoice dispatch review is immutable';
          END IF;
          IF (OLD.reconciled_by_id IS NOT NULL OR OLD.reconciled_at IS NOT NULL OR OLD.reconciliation_evidence IS NOT NULL) AND
            ROW(NEW.reconciled_by_id, NEW.reconciled_at, NEW.reconciliation_evidence) IS DISTINCT FROM
            ROW(OLD.reconciled_by_id, OLD.reconciled_at, OLD.reconciliation_evidence) THEN
            RAISE EXCEPTION 'Consultant invoice reconciliation review is immutable';
          END IF;
          RETURN NEW;
        END; $$;
      SQL
    end
  end

  def down
    if select_value("SELECT EXISTS(SELECT 1 FROM payroll_consultant_invoice_deliveries WHERE reconciled_by_id IS NOT NULL)")
      raise ActiveRecord::IrreversibleMigration, "Preserve consultant invoice reconciliation reviews"
    end
    safety_assured do
      execute <<~SQL
        CREATE OR REPLACE FUNCTION public.protect_consultant_invoice_delivery() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF TG_OP='DELETE' OR NEW.payroll_consultant_invoice_id IS DISTINCT FROM OLD.payroll_consultant_invoice_id OR
            NEW.attempt_number IS DISTINCT FROM OLD.attempt_number OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Consultant invoice delivery identity is immutable';
          END IF;
          RETURN NEW;
        END; $$;
      SQL
    end
    remove_check_constraint :payroll_consultant_invoice_deliveries, name: "invoice_delivery_reconciliation_complete"
    remove_column :payroll_consultant_invoice_deliveries, :reconciliation_evidence
    remove_column :payroll_consultant_invoice_deliveries, :reconciled_at
    remove_reference :payroll_consultant_invoice_deliveries, :reconciled_by, foreign_key: { to_table: :users }
  end
end
