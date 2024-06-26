# frozen_string_literal: true

class CreateCustomLeaveUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :custom_leave_users do |t|
      t.references :custom_leave, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
