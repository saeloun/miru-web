# frozen_string_literal: true

class CreateDesktopCurrentTimers < ActiveRecord::Migration[8.1]
  def change
    create_table :desktop_current_timers do |t|
      t.references :user, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.jsonb :current_timer, null: false, default: {}

      t.timestamps
    end

    add_index :desktop_current_timers, [:user_id, :company_id], unique: true
  end
end
