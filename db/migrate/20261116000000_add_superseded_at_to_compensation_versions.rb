# frozen_string_literal: true

class AddSupersededAtToCompensationVersions < ActiveRecord::Migration[8.1]
  def up
    add_column :compensation_versions, :superseded_at, :datetime
  end

  def down
    connection.transaction do
      safety_assured { execute "LOCK TABLE compensation_versions IN ACCESS EXCLUSIVE MODE" }
      if connection.select_value("SELECT 1 FROM compensation_versions WHERE superseded_at IS NOT NULL LIMIT 1")
        raise ActiveRecord::IrreversibleMigration, "Keep salary supersession metadata after it has been used"
      end
      remove_column :compensation_versions, :superseded_at
    end
  end
end
