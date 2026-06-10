# frozen_string_literal: true

class CreateQuickbooksConnections < ActiveRecord::Migration[8.1]
  def change
    create_table :quickbooks_connections do |t|
      t.references :company, null: false, foreign_key: true
      t.string :realm_id
      t.integer :environment, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.text :access_token_ciphertext
      t.text :refresh_token_ciphertext
      t.datetime :access_token_expires_at
      t.datetime :refresh_token_expires_at
      t.datetime :last_refresh_at
      t.datetime :last_successful_sync_at
      t.datetime :connected_at
      t.datetime :disconnected_at
      t.jsonb :settings, null: false, default: {}

      t.timestamps
    end

    add_index :quickbooks_connections,
      [:company_id, :environment],
      unique: true,
      where: "disconnected_at IS NULL",
      name: "idx_qbo_connections_active_company_environment"

    add_index :quickbooks_connections,
      [:realm_id, :environment],
      unique: true,
      where: "realm_id IS NOT NULL AND disconnected_at IS NULL",
      name: "idx_qbo_connections_active_realm_environment"
  end
end
