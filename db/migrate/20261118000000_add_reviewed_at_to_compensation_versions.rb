# frozen_string_literal: true

class AddReviewedAtToCompensationVersions < ActiveRecord::Migration[8.1]
  def up
    add_column :compensation_versions, :reviewed_at, :datetime
  end

  def down
    if connection.select_value("SELECT 1 FROM compensation_versions WHERE reviewed_at IS NOT NULL LIMIT 1")
      raise ActiveRecord::IrreversibleMigration, "Keep salary review metadata after review decisions have been recorded"
    end
    remove_column :compensation_versions, :reviewed_at
  end
end
