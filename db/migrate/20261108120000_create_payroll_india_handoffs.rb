# frozen_string_literal: true

class CreatePayrollIndiaHandoffs < ActiveRecord::Migration[8.0]
  def up
    create_table :payroll_india_handoffs do |t|
      t.references :company, :payroll_run, :payroll_revision, :employment, :consultant_compensation, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.text :report, null: false
      t.string :line_digest, :bank_digest, null: false
      t.bigint :entitlement_minor, null: false
      t.bigint :credited_minor, null: false, default: 0
      t.datetime :released_at, :fully_credited_at
      t.timestamps
    end
    add_index :payroll_india_handoffs, [:payroll_run_id, :employment_id], unique: true,
      where: "released_at IS NULL", name: "payroll_india_one_active_handoff"
    add_check_constraint :payroll_india_handoffs, "entitlement_minor > 0 AND credited_minor >= 0", name: "payroll_india_handoff_amounts"

    create_table :payroll_india_deliveries do |t|
      t.references :payroll_india_handoff, null: false, foreign_key: true
      t.integer :attempt_number, null: false
      t.string :state, null: false, default: "queued"
      t.datetime :started_at, :sent_at
      t.string :error_code
      t.text :review_evidence
      t.references :reviewed_by, foreign_key: { to_table: :users }
      t.datetime :reviewed_at
      t.timestamps
    end
    add_index :payroll_india_deliveries, [:payroll_india_handoff_id, :attempt_number], unique: true, name: "payroll_india_delivery_attempt"
    add_check_constraint :payroll_india_deliveries, "attempt_number > 0", name: "payroll_india_attempt_positive"
    add_check_constraint :payroll_india_deliveries, "state IN ('queued', 'sending', 'sent', 'failed', 'uncertain')", name: "payroll_india_delivery_state"

    create_table :payroll_india_credits do |t|
      t.references :company, null: false, foreign_key: true
      t.references :payroll_india_handoff, null: false, foreign_key: true
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.bigint :amount_minor, null: false
      t.date :credited_on, null: false
      t.text :reference, null: false
      t.string :reference_digest, null: false
      t.timestamps
    end
    add_index :payroll_india_credits, [:company_id, :reference_digest], unique: true, name: "payroll_india_credit_reference"
    add_check_constraint :payroll_india_credits, "amount_minor > 0", name: "payroll_india_credit_positive"

    safety_assured do
      execute <<~SQL
        CREATE FUNCTION protect_payroll_india_handoff() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF TG_OP = 'DELETE' OR
            (to_jsonb(OLD) - ARRAY['credited_minor','released_at','fully_credited_at','updated_at']) IS DISTINCT FROM
            (to_jsonb(NEW) - ARRAY['credited_minor','released_at','fully_credited_at','updated_at']) THEN
            RAISE EXCEPTION 'Payroll India handoff snapshot is immutable';
          END IF;
          RETURN NEW;
        END;
        $$;
        CREATE TRIGGER payroll_india_handoff_immutable BEFORE UPDATE OR DELETE ON payroll_india_handoffs
        FOR EACH ROW EXECUTE FUNCTION protect_payroll_india_handoff();
        CREATE TRIGGER payroll_india_credits_immutable BEFORE UPDATE OR DELETE ON payroll_india_credits
        FOR EACH ROW EXECUTE FUNCTION protect_payroll_review_history();
        CREATE FUNCTION protect_payroll_india_delivery() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF TG_OP = 'DELETE' OR NEW.payroll_india_handoff_id IS DISTINCT FROM OLD.payroll_india_handoff_id OR
            NEW.attempt_number IS DISTINCT FROM OLD.attempt_number OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
            RAISE EXCEPTION 'Payroll India delivery identity is immutable';
          END IF;
          RETURN NEW;
        END;
        $$;
        CREATE TRIGGER payroll_india_delivery_immutable BEFORE UPDATE OR DELETE ON payroll_india_deliveries
        FOR EACH ROW EXECUTE FUNCTION protect_payroll_india_delivery();
      SQL
    end
  end

  def down
    tables = %w[payroll_india_credits payroll_india_deliveries payroll_india_handoffs]
    connection.transaction do
      safety_assured { execute "LOCK TABLE #{tables.join(', ')} IN ACCESS EXCLUSIVE MODE" }
      if tables.any? { |table| select_value("SELECT EXISTS (SELECT 1 FROM #{table})") }
        raise ActiveRecord::IrreversibleMigration, "Preserve India payroll handoff history before rolling back."
      end
      tables.each { |table| drop_table table }
      safety_assured do
        execute "DROP FUNCTION protect_payroll_india_handoff()"
        execute "DROP FUNCTION protect_payroll_india_delivery()"
      end
    end
  end
end
