# frozen_string_literal: true

class AddDeviseExtensionColumnsToUsers < ActiveRecord::Migration[7.2]
  disable_ddl_transaction!

  def up
    add_column :users, :jti, :string
    add_column :users, :unique_session_id, :string

    add_column :users, :invitation_token, :string
    add_column :users, :invitation_created_at, :datetime
    add_column :users, :invitation_sent_at, :datetime
    add_column :users, :invitation_accepted_at, :datetime
    add_column :users, :invitation_limit, :integer
    add_column :users, :invited_by_type, :string
    add_column :users, :invited_by_id, :bigint
    add_column :users, :invitations_count, :integer, default: 0

    safety_assured do
      backfill_security_columns!
      change_column_null :users, :jti, false
      change_column_null :users, :unique_session_id, false
    end

    add_index :users, :jti, unique: true, algorithm: :concurrently
    add_index :users, :unique_session_id, unique: true, algorithm: :concurrently
    add_index :users, :invitation_token, unique: true, algorithm: :concurrently
    add_index :users, [:invited_by_type, :invited_by_id], algorithm: :concurrently
  end

  def down
    remove_index :users, [:invited_by_type, :invited_by_id]
    remove_index :users, :invitation_token
    remove_index :users, :unique_session_id
    remove_index :users, :jti

    remove_column :users, :invitations_count
    remove_column :users, :invited_by_id
    remove_column :users, :invited_by_type
    remove_column :users, :invitation_limit
    remove_column :users, :invitation_accepted_at
    remove_column :users, :invitation_sent_at
    remove_column :users, :invitation_created_at
    remove_column :users, :invitation_token

    remove_column :users, :unique_session_id
    remove_column :users, :jti
  end

  private

    def backfill_security_columns!
      user_ids = connection.select_values("SELECT id FROM users")
      user_ids.each do |id|
        connection.execute(
          sanitize_sql_array(
            [
              "UPDATE users SET jti = ?, unique_session_id = ? WHERE id = ?",
              SecureRandom.uuid,
              SecureRandom.uuid,
              id
            ]
          )
        )
      end
    end

    def sanitize_sql_array(values)
      ApplicationRecord.send(:sanitize_sql_array, values)
    end
end
