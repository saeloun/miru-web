# frozen_string_literal: true

class AddPasskeysSupport < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def up
    add_column :users, :webauthn_id, :string unless column_exists?(:users, :webauthn_id)
    unless column_exists?(:users, :passkey_required_for_login)
      add_column :users, :passkey_required_for_login, :boolean, default: false, null: false
    end
    unless index_exists?(:users, :webauthn_id)
      add_index :users, :webauthn_id, unique: true, algorithm: :concurrently
    end

    unless table_exists?(:passkeys)
      create_table :passkeys do |t|
        t.bigint :user_id, null: false
        t.string :external_id, null: false
        t.text :public_key, null: false
        t.bigint :sign_count, null: false, default: 0
        t.string :nickname
        t.datetime :last_used_at
        t.timestamps
      end
    end

    add_foreign_key :passkeys, :users, validate: false unless foreign_key_exists?(:passkeys, :users)
    add_index :passkeys, :user_id, algorithm: :concurrently unless index_exists?(:passkeys, :user_id)
    unless index_exists?(:passkeys, :external_id)
      add_index :passkeys, :external_id, unique: true, algorithm: :concurrently
    end
  end

  def down
    remove_index :passkeys, :external_id, algorithm: :concurrently if index_exists?(:passkeys, :external_id)
    remove_index :passkeys, :user_id, algorithm: :concurrently if index_exists?(:passkeys, :user_id)
    remove_foreign_key :passkeys, :users if foreign_key_exists?(:passkeys, :users)
    drop_table :passkeys, if_exists: true
    remove_index :users, :webauthn_id, algorithm: :concurrently if index_exists?(:users, :webauthn_id)
    remove_column :users, :passkey_required_for_login, if_exists: true
    remove_column :users, :webauthn_id, if_exists: true
  end
end
