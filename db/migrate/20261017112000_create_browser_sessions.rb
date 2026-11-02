# frozen_string_literal: true

class CreateBrowserSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :browser_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token_digest, null: false
      t.datetime :revoked_at
      t.timestamps
    end

    add_index :browser_sessions, :token_digest, unique: true
  end
end
