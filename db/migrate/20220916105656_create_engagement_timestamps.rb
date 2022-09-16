# frozen_string_literal: true

class CreateEngagementTimestamps < ActiveRecord::Migration[7.0]
  def change
    create_table :engagement_timestamps do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :engage_code
      t.references :engage_updated_by, foreign_key: { to_table: :users }
      t.datetime :engage_updated_at
      t.integer :week_code

      t.timestamps
    end
    add_column :users, :engage_week_code, :integer
    add_column :users, :engage_expires_at, :datetime
  end
end
