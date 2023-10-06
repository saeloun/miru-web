# frozen_string_literal: true

class AddUniqueIndexToLeavesYearAndCompanyId < ActiveRecord::Migration[7.0]
  disable_ddl_transaction!

  def change
    add_index :leaves, [:year, :company_id], unique: true, algorithm: :concurrently
  end
end
