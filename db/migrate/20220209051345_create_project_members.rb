# frozen_string_literal: true

class CreateProjectMembers < ActiveRecord::Migration[7.0]
  def change
    create_table :project_members do |t|
      t.references :user, null: false, foreign_key: true
      t.references :project, null: false, foreign_key: true
      t.decimal :hourly_rate, null: false, default: 0.0
      t.timestamps
    end

    add_column :project_members, :discarded_at, :datetime
    add_index :project_members, :discarded_at
  end
end
