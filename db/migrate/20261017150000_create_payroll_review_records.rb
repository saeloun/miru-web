# frozen_string_literal: true

class CreatePayrollReviewRecords < ActiveRecord::Migration[8.1]
  def up
    create_table :payroll_runs do |t|
      t.references :company, null: false, foreign_key: true
      t.date :period, null: false
      t.string :currency, null: false
      t.boolean :dry_run, null: false, default: true
      t.references :accounts_reviewer, null: false, foreign_key: { to_table: :users }
      t.references :final_reviewer, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end
    add_index :payroll_runs, [:company_id, :period, :currency], unique: true
    add_check_constraint :payroll_runs, "EXTRACT(DAY FROM period) = 1", name: "payroll_run_month_start"
    add_check_constraint :payroll_runs, "currency ~ '^[A-Z]{3}$'", name: "payroll_run_currency"
    add_check_constraint :payroll_runs, "dry_run = TRUE", name: "payroll_run_dry_run_only"
    add_check_constraint :payroll_runs, "accounts_reviewer_id <> final_reviewer_id", name: "payroll_distinct_reviewers"

    create_table :payroll_revisions do |t|
      t.references :payroll_run, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.integer :number, null: false
      t.string :idempotency_key, null: false
      t.string :digest, null: false
      t.string :parent_digest
      t.jsonb :payroll_payload, null: false
      t.timestamps
    end
    add_index :payroll_revisions, [:payroll_run_id, :number], unique: true
    add_index :payroll_revisions, [:payroll_run_id, :idempotency_key], unique: true
    add_check_constraint :payroll_revisions, "number > 0", name: "payroll_revision_positive_number"

    create_table :payroll_approvals do |t|
      t.references :payroll_revision, null: false, foreign_key: true
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.string :stage, null: false
      t.timestamps
    end
    add_index :payroll_approvals, [:payroll_revision_id, :stage], unique: true
    add_check_constraint :payroll_approvals, "stage IN ('accounts', 'final')", name: "payroll_approval_stage"

    safety_assured do
      execute <<~SQL
        CREATE OR REPLACE FUNCTION protect_payroll_review_history() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          RAISE EXCEPTION 'Payroll review history is immutable';
        END;
        $$;
      SQL
      %w[payroll_runs payroll_revisions payroll_approvals].each do |table|
        execute <<~SQL
          CREATE TRIGGER #{table}_immutable BEFORE UPDATE OR DELETE ON #{table}
          FOR EACH ROW EXECUTE FUNCTION protect_payroll_review_history();
        SQL
      end
    end
  end

  def down
    drop_table :payroll_approvals
    drop_table :payroll_revisions
    drop_table :payroll_runs
    safety_assured { execute "DROP FUNCTION protect_payroll_review_history()" }
  end
end
