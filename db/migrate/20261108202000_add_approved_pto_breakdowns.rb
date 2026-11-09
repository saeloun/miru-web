# frozen_string_literal: true

class AddApprovedPtoBreakdowns < ActiveRecord::Migration[8.1]
  def up
    add_column :payroll_pto_entries, :allocations, :jsonb, null: false, default: []
    add_column :payroll_pto_entries, :origin_component, :string
    # The PTO tables are introduced by this same unreleased migration batch and have no existing writers.
    safety_assured { add_reference :payroll_pto_recoveries, :actor, index: false, foreign_key: { to_table: :users } }
    add_column :payroll_pto_recoveries, :reason, :text
    safety_assured do
      remove_index :payroll_pto_entries, name: "pto_obligation_one_review_root"
      add_index :payroll_pto_entries, [:origin_entry_id, :origin_component], unique: true,
        where: "origin_entry_id IS NOT NULL AND previous_entry_id IS NULL", name: "pto_obligation_one_review_root"
      remove_check_constraint :payroll_pto_entries, name: "pto_entry_accounting_sign"
      add_check_constraint :payroll_pto_entries,
        "minutes >= 0 AND debt_minutes >= 0 AND debt_minutes <= minutes AND cash_amount_minor >= 0 AND ((kind IN ('paid','advance','review_advance') AND balance_delta_minutes = -minutes) OR (kind = 'allocation' AND balance_delta_minutes BETWEEN -minutes AND 0) OR (kind = 'accrual' AND balance_delta_minutes = minutes) OR (kind IN ('unpaid','defer','waive','correction','opening','review_defer','review_correction') AND balance_delta_minutes = 0) OR (kind IN ('review_unpaid','review_waive') AND balance_delta_minutes BETWEEN 0 AND minutes)) AND (kind = 'review_unpaid' OR cash_amount_minor = 0) AND ((kind LIKE 'review_%' AND origin_entry_id IS NOT NULL AND origin_component IN ('opening','advance','defer','correction')) OR (kind NOT LIKE 'review_%' AND origin_entry_id IS NULL))",
        name: "pto_entry_accounting_sign"
    end
    require_relative "20261108200500_protect_payroll_pto_history" unless defined?(ProtectPayrollPtoHistory)
    ProtectPayrollPtoHistory.new.migrate(:up)
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Approved PTO financial history requires a forward fix or a verified database restore"
  end
end
