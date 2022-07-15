# frozen_string_literal: true

class CreateInvitations < ActiveRecord::Migration[7.0]
  def change
    create_table :invitations do |t|
      t.references :company, null: false, foreign_key: true
      t.references :sender, references: :users, foreign_key: { to_table: :users }, null: false
      t.string :recipient_email, null: false
      t.string :token, null: false, index: { unique: true }
      t.datetime :accepted_at
      t.datetime :expired_at
      t.string :first_name
      t.string :last_name
      t.integer :role, default: 0, null: false

      t.timestamps
    end
  end
end
