# frozen_string_literal: true

class AddDiscardedAtToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :discarded_at, :datetime
    add_index :users, :discarded_at
  end
end
