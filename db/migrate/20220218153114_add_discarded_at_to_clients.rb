# frozen_string_literal: true

class AddDiscardedAtToClients < ActiveRecord::Migration[7.0]
  def change
    add_column :clients, :discarded_at, :datetime
    add_index :clients, :discarded_at
  end
end
