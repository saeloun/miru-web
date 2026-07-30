# frozen_string_literal: true

class CreateMCPIdempotencyRecords < ActiveRecord::Migration[8.0]
  def change
    create_table :mcp_idempotency_records do |t|
      t.string :key_digest, null: false
      t.jsonb :response, null: false
      t.datetime :expires_at, null: false

      t.timestamps
    end

    add_index :mcp_idempotency_records, :key_digest, unique: true
    add_index :mcp_idempotency_records, :expires_at
  end
end
