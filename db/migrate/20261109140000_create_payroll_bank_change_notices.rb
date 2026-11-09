# frozen_string_literal: true

class CreatePayrollBankChangeNotices < ActiveRecord::Migration[8.1]
  def change
    create_table :payroll_bank_change_notices do |t|
      t.references :company, null: false, foreign_key: true
      t.references :employment, null: false
      t.references :recipient, null: false, foreign_key: { to_table: :users }
      t.uuid :event_id, null: false
      t.string :state, null: false, default: "queued"
      t.datetime :attempted_at
      t.datetime :sent_at
      t.timestamps
      t.foreign_key :employments, column: [:company_id, :employment_id], primary_key: [:company_id, :id]
    end
    add_index :payroll_bank_change_notices, [:event_id, :recipient_id], unique: true, name: "bank_change_notice_delivery_identity"
    add_index :payroll_bank_change_notices, [:state, :id]
    add_check_constraint :payroll_bank_change_notices,
      "state IN ('queued','sending','sent','uncertain','skipped') AND (state NOT IN ('sending','sent','uncertain') OR attempted_at IS NOT NULL) AND (state <> 'sent' OR sent_at IS NOT NULL)",
      name: "bank_change_notice_states"
  end
end
