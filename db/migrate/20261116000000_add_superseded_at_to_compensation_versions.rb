# frozen_string_literal: true

class AddSupersededAtToCompensationVersions < ActiveRecord::Migration[8.1]
  def change
    add_column :compensation_versions, :superseded_at, :datetime
  end
end
