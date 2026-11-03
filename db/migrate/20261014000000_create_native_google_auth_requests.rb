# frozen_string_literal: true

class CreateNativeGoogleAuthRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :native_google_auth_requests do |t|
      t.string :request_digest, null: false
      t.string :code_challenge, null: false
      t.string :client_state, null: false
      t.string :intent, null: false
      t.string :browser_digest
      t.string :code_digest
      t.string :outcome
      t.string :auth_state_digest
      t.references :user, foreign_key: { on_delete: :cascade }
      t.references :company, foreign_key: { on_delete: :cascade }
      t.references :invitation, foreign_key: { on_delete: :cascade }
      t.datetime :expires_at, null: false
      t.datetime :code_expires_at
      t.datetime :consumed_at
      t.datetime :cancelled_at
      t.timestamps
    end
    add_index :native_google_auth_requests, :request_digest, unique: true
    add_index :native_google_auth_requests, :code_digest, unique: true
    add_index :native_google_auth_requests, :expires_at
  end
end
