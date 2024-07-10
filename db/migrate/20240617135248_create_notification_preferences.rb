# frozen_string_literal: true

class CreateNotificationPreferences < ActiveRecord::Migration[7.1]
  def change
    create_table :notification_preferences do |t|
      t.references :user, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.boolean :notification_enabled, default: false, null: false
      t.index [:user_id, :company_id], unique: true

      t.timestamps
    end
  end
end
