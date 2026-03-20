# frozen_string_literal: true

class CreateCliSessions < ActiveRecord::Migration[8.0]
  def change
    create_table :cli_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.datetime :last_used_at
      t.datetime :revoked_at

      t.timestamps
    end

    add_index :cli_sessions, :token_digest, unique: true
    add_index :cli_sessions, :expires_at
  end
end
