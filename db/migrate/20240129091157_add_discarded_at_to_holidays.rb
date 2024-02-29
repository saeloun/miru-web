# frozen_string_literal: true

class AddDiscardedAtToHolidays < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_column :holidays, :discarded_at, :datetime
    add_index :holidays, :discarded_at, algorithm: :concurrently
  end
end
