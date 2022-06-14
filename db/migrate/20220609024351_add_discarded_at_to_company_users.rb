# frozen_string_literal: true

class AddDiscardedAtToCompanyUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :company_users, :discarded_at, :datetime
    add_index :company_users, :discarded_at
  end
end
