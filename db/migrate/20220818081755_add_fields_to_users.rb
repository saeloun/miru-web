# frozen_string_literal: true

class AddFieldsToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :engage_code, :integer
    add_reference :users, :engage_updated_by, foreign_key: { to_table: :users }
    add_column :users, :engage_updated_at, :datetime
  end
end
