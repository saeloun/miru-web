# frozen_string_literal: true

class CreatePayrollPtoNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :payroll_pto_notifications do |t|
      t.references :company, null: false, foreign_key: true
      t.references :employment, null: false
      t.references :recipient, null: false, foreign_key: { to_table: :users }
      t.string :kind, null: false
      t.string :source_digest, null: false
      t.string :state, null: false, default: "queued"
      t.datetime :attempted_at
      t.datetime :sent_at
      t.timestamps
      t.foreign_key :employments, column: [:company_id, :employment_id], primary_key: [:company_id, :id]
    end
    add_index :payroll_pto_notifications, [:employment_id, :recipient_id, :kind, :source_digest], unique: true, name: "pto_notification_delivery_identity"
    add_check_constraint :payroll_pto_notifications, "state IN ('queued','sending','sent','uncertain') AND kind IN ('threshold','correction','year_end','exit')", name: "pto_notification_states"
  end
end
