# frozen_string_literal: true

class AddPasswordChangedAtToUsers < ActiveRecord::Migration[7.2]
  def up
    add_column :users, :password_changed_at, :datetime

    safety_assured do
      execute <<~SQL.squish
        UPDATE users
        SET password_changed_at = created_at
        WHERE password_changed_at IS NULL
      SQL
    end
  end

  def down
    remove_column :users, :password_changed_at
  end
end
