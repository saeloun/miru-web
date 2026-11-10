# frozen_string_literal: true

class CreatePayrollProfileCompletionRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :payroll_profile_completion_requests do |t|
      t.references :company, null: false, foreign_key: true
      t.references :payroll_run, null: false, foreign_key: true
      t.references :employment, null: false
      t.references :recipient, null: false, foreign_key: { to_table: :users }
      t.references :requested_by, null: false, foreign_key: { to_table: :users }
      t.string :idempotency_key, null: false, limit: 128
      t.string :command_digest, null: false, limit: 64
      t.string :source_digest, null: false, limit: 64
      t.jsonb :categories, null: false, default: []
      t.string :state, null: false, default: "queued"
      t.datetime :attempted_at
      t.datetime :sent_at
      t.timestamps
      t.foreign_key :employments, column: [:company_id, :employment_id], primary_key: [:company_id, :id]
    end
    add_index :payroll_profile_completion_requests, [:payroll_run_id, :requested_by_id, :idempotency_key], unique: true,
      name: "profile_completion_command_identity"
    add_index :payroll_profile_completion_requests, [:payroll_run_id, :employment_id, :source_digest], unique: true,
      where: "state <> 'skipped'", name: "profile_completion_delivery_identity"
    add_index :payroll_profile_completion_requests, [:state, :id]
    add_check_constraint :payroll_profile_completion_requests,
      "state IN ('queued','sending','sent','uncertain','skipped') AND (state NOT IN ('sending','sent','uncertain') OR attempted_at IS NOT NULL) AND (state <> 'sent' OR sent_at IS NOT NULL)",
      name: "profile_completion_delivery_states"
    add_check_constraint :payroll_profile_completion_requests,
      "jsonb_typeof(categories) = 'array' AND jsonb_array_length(categories) BETWEEN 1 AND 2 AND categories <@ '[\"bank_details\",\"billing_identity\"]'::jsonb",
      name: "profile_completion_categories"
    add_check_constraint :payroll_profile_completion_requests,
      "idempotency_key ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$' AND source_digest ~ '^[0-9a-f]{64}$' AND command_digest ~ '^[0-9a-f]{64}$'",
      name: "profile_completion_command_format"
  end
end
