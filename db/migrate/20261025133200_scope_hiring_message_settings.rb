# frozen_string_literal: true

class ScopeHiringMessageSettings < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_index :hiring_settings, [:company_id, :id], unique: true, algorithm: :concurrently
    add_foreign_key :hiring_messages, :hiring_settings, column: [:company_id, :hiring_setting_id],
      primary_key: [:company_id, :id], validate: false
    validate_foreign_key :hiring_messages, :hiring_settings, column: [:company_id, :hiring_setting_id]
  end
end
