# frozen_string_literal: true

class CreatePayrollRemittanceDocuments < ActiveRecord::Migration[8.1]
  def up
    create_table :payroll_remittance_documents do |t|
      t.references :company, null: false, foreign_key: true
      t.references :payroll_payment_instruction, null: false, foreign_key: true, index: { name: "remittance_payment_leg" }
      t.references :uploader, null: false, foreign_key: { to_table: :users }
      t.references :previous_document, foreign_key: { to_table: :payroll_remittance_documents }, index: { unique: true }
      t.references :blob, null: false, foreign_key: { to_table: :active_storage_blobs }
      t.string :document_kind, null: false
      t.string :idempotency_key, null: false, limit: 100
      t.string :command_digest, null: false, limit: 64
      t.text :details, null: false
      t.timestamps
    end
    add_index :payroll_remittance_documents, [:company_id, :uploader_id, :idempotency_key], unique: true, name: "remittance_command_once"
    add_index :payroll_remittance_documents, [:payroll_payment_instruction_id, :document_kind], unique: true,
      where: "previous_document_id IS NULL", name: "remittance_first_document"
    add_check_constraint :payroll_remittance_documents, "document_kind IN ('firc','fira','inward_remittance_advice')", name: "remittance_document_kind"
    add_check_constraint :payroll_remittance_documents, "command_digest ~ '^[a-f0-9]{64}$' AND length(idempotency_key) > 0", name: "remittance_command_identity"
    safety_assured do
      execute <<~SQL
        CREATE FUNCTION validate_payroll_remittance_document() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM payroll_payment_instructions p WHERE p.id = NEW.payroll_payment_instruction_id AND p.company_id = NEW.company_id) THEN
            RAISE EXCEPTION 'Remittance payment identity mismatch';
          END IF;
          IF NEW.previous_document_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM payroll_remittance_documents d WHERE d.id = NEW.previous_document_id AND
            d.company_id = NEW.company_id AND d.payroll_payment_instruction_id = NEW.payroll_payment_instruction_id AND d.document_kind = NEW.document_kind
          ) THEN
            RAISE EXCEPTION 'Remittance correction identity mismatch';
          END IF;
          RETURN NEW;
        END; $$;
        CREATE TRIGGER remittance_document_identity BEFORE INSERT ON payroll_remittance_documents FOR EACH ROW EXECUTE FUNCTION validate_payroll_remittance_document();
        CREATE TRIGGER payroll_remittance_documents_immutable BEFORE UPDATE OR DELETE ON payroll_remittance_documents FOR EACH ROW EXECUTE FUNCTION protect_payroll_review_history();
      SQL
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Retain bank remittance evidence" if select_value("SELECT EXISTS(SELECT 1 FROM payroll_remittance_documents)")

    drop_table :payroll_remittance_documents
    execute "DROP FUNCTION validate_payroll_remittance_document()"
  end
end
