# frozen_string_literal: true

class AddAgentsAndReviewableAgentEntries < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def change
    create_table :agents do |t|
      t.references :company, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :default_project, foreign_key: { to_table: :projects }
      t.string :name, null: false
      t.string :provider, null: false, default: "custom"
      t.boolean :active, null: false, default: true
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :agents, [:company_id, :name], unique: true
    add_index :agents, [:company_id, :active]

    create_table :agent_keys do |t|
      t.references :agent, null: false, foreign_key: true
      t.references :created_by, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.string :token_digest, null: false
      t.datetime :last_used_at
      t.datetime :revoked_at

      t.timestamps
    end

    add_index :agent_keys, :token_digest, unique: true
    add_index :agent_keys, [:agent_id, :revoked_at]

    add_reference :timesheet_entries, :agent, index: { algorithm: :concurrently }
    add_column :timesheet_entries, :review_status, :integer, null: false, default: 0
    add_column :timesheet_entries, :external_run_id, :string
    add_column :timesheet_entries, :external_session_id, :string
    add_column :timesheet_entries, :proof_url, :text
    add_column :timesheet_entries, :proof_metadata, :jsonb, null: false, default: {}

    add_index :timesheet_entries, :review_status, algorithm: :concurrently
    add_index :timesheet_entries, [:agent_id, :review_status], algorithm: :concurrently
    add_index :timesheet_entries, [:review_status, :bill_status], algorithm: :concurrently
  end
end
