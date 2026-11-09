# frozen_string_literal: true

class CreatePayrollPtoLedger < ActiveRecord::Migration[8.1]
  def up
    create_table :consultant_pto_policies do |t|
      t.references :company, null: false, foreign_key: true
      t.references :employment, null: false
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.date :effective_on, null: false
      t.date :opening_on, null: false
      t.decimal :opening_minutes, precision: 14, scale: 2, null: false
      t.decimal :monthly_accrual_minutes, precision: 14, scale: 2, null: false
      t.integer :accrual_day, null: false
      t.integer :leave_year_month, null: false
      t.integer :leave_year_day, null: false
      t.string :carry_rule, null: false
      t.string :rate_basis, null: false
      t.decimal :advance_limit_minutes, precision: 14, scale: 2, null: false
      t.decimal :exception_threshold_minutes, precision: 14, scale: 2, null: false
      t.decimal :negative_threshold_minutes, precision: 14, scale: 2, null: false
      t.text :reason, null: false
      t.string :evidence, null: false
      t.string :idempotency_key, null: false
      t.timestamps
    end
    add_index :consultant_pto_policies, [:company_id, :employment_id, :id], unique: true, name: "pto_policy_tenant_identity"
    add_index :consultant_pto_policies, [:employment_id, :idempotency_key], unique: true
    # These referencing tables are new and empty; no existing rows need a validation scan.
    safety_assured do
      add_foreign_key :consultant_pto_policies, :employments, column: [:company_id, :employment_id], primary_key: [:company_id, :id]
    end
    add_check_constraint :consultant_pto_policies,
      "monthly_accrual_minutes >= 0 AND advance_limit_minutes >= 0 AND exception_threshold_minutes >= 0 AND negative_threshold_minutes >= 0 AND accrual_day BETWEEN 1 AND 28 AND leave_year_month BETWEEN 1 AND 12 AND leave_year_day BETWEEN 1 AND 28 AND carry_rule = 'review' AND rate_basis = 'origin_period_fee' AND opening_on <= effective_on",
      name: "pto_policy_configured_values"

    create_table :payroll_pto_entries do |t|
      t.references :company, null: false, foreign_key: true
      t.references :employment, null: false
      t.references :consultant_pto_policy, null: false
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.references :previous_entry, index: { unique: true }
      t.references :origin_entry
      t.date :period, null: false
      t.string :case_key, null: false
      t.string :kind, null: false
      t.decimal :minutes, null: false
      t.decimal :balance_delta_minutes, null: false
      t.decimal :debt_minutes, null: false, default: 0
      t.bigint :cash_amount_minor, null: false, default: 0
      t.jsonb :rate_basis, null: false, default: {}
      t.string :source_digest, null: false
      t.text :reason, null: false
      t.string :idempotency_key, null: false
      t.timestamps
    end
    add_index :payroll_pto_entries, [:company_id, :employment_id, :id], unique: true, name: "pto_entry_tenant_identity"
    add_index :payroll_pto_entries, [:employment_id, :case_key], unique: true, where: "previous_entry_id IS NULL", name: "pto_entry_one_root"
    add_index :payroll_pto_entries, [:employment_id, :idempotency_key], unique: true
    safety_assured do
      add_foreign_key :payroll_pto_entries, :employments, column: [:company_id, :employment_id], primary_key: [:company_id, :id]
      add_foreign_key :payroll_pto_entries, :consultant_pto_policies, column: [:company_id, :employment_id, :consultant_pto_policy_id], primary_key: [:company_id, :employment_id, :id]
      add_foreign_key :payroll_pto_entries, :payroll_pto_entries, column: [:company_id, :employment_id, :previous_entry_id], primary_key: [:company_id, :employment_id, :id]
      add_foreign_key :payroll_pto_entries, :payroll_pto_entries, column: [:company_id, :employment_id, :origin_entry_id], primary_key: [:company_id, :employment_id, :id]
    end
    add_check_constraint :payroll_pto_entries,
      "minutes >= 0 AND debt_minutes >= 0 AND debt_minutes <= minutes AND cash_amount_minor >= 0 AND ((kind IN ('paid','advance','review_advance') AND balance_delta_minutes = -minutes) OR (kind = 'accrual' AND balance_delta_minutes = minutes) OR (kind IN ('unpaid','defer','waive','correction','opening','review_defer','review_correction') AND balance_delta_minutes = 0) OR (kind IN ('review_unpaid','review_waive') AND balance_delta_minutes BETWEEN 0 AND minutes)) AND (kind = 'review_unpaid' OR cash_amount_minor = 0) AND ((kind LIKE 'review_%' AND origin_entry_id IS NOT NULL) OR (kind NOT LIKE 'review_%' AND origin_entry_id IS NULL))",
      name: "pto_entry_accounting_sign"

    create_table :payroll_pto_allocations do |t|
      t.references :company, null: false, foreign_key: true
      t.references :employment, null: false
      t.references :accrual_entry, null: false
      t.references :origin_entry, null: false
      t.decimal :minutes, null: false
      t.timestamps
    end
    add_index :payroll_pto_allocations, [:accrual_entry_id, :origin_entry_id], unique: true
    safety_assured do
      add_foreign_key :payroll_pto_allocations, :employments, column: [:company_id, :employment_id], primary_key: [:company_id, :id]
      [:accrual_entry_id, :origin_entry_id].each do |column|
        add_foreign_key :payroll_pto_allocations, :payroll_pto_entries, column: [:company_id, :employment_id, column], primary_key: [:company_id, :employment_id, :id]
      end
    end
    add_check_constraint :payroll_pto_allocations, "minutes > 0", name: "pto_allocation_positive"

    create_table :payroll_pto_recoveries do |t|
      t.references :company, null: false, foreign_key: true
      t.references :employment, null: false
      t.references :payroll_pto_entry, null: false
      t.references :payroll_run, null: false, foreign_key: true
      t.references :payroll_revision, null: false, foreign_key: true
      t.references :previous_recovery, index: { unique: true }
      t.string :kind, null: false
      t.bigint :amount_minor, null: false
      t.timestamps
    end
    add_index :payroll_pto_recoveries, [:company_id, :employment_id, :id], unique: true, name: "pto_recovery_tenant_identity"
    add_index :payroll_pto_recoveries, :payroll_pto_entry_id, unique: true, where: "previous_recovery_id IS NULL", name: "pto_recovery_one_root"
    safety_assured do
      add_foreign_key :payroll_pto_recoveries, :employments, column: [:company_id, :employment_id], primary_key: [:company_id, :id]
      add_foreign_key :payroll_pto_recoveries, :payroll_pto_entries, column: [:company_id, :employment_id, :payroll_pto_entry_id], primary_key: [:company_id, :employment_id, :id]
      add_foreign_key :payroll_pto_recoveries, :payroll_pto_recoveries, column: [:company_id, :employment_id, :previous_recovery_id], primary_key: [:company_id, :employment_id, :id]
    end
    add_check_constraint :payroll_pto_recoveries, "amount_minor >= 0 AND kind IN ('reserved','released','settled','returned_review')", name: "pto_recovery_event_values"
  end

  def down
    safety_assured do
      execute "DROP FUNCTION IF EXISTS validate_payroll_pto_recovery_tenant() CASCADE"
      %i[payroll_pto_recoveries payroll_pto_allocations payroll_pto_entries consultant_pto_policies].each do |table|
        drop_table table, if_exists: true
      end
    end
  end
end
