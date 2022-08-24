# frozen_string_literal: true

class AddIsTeamLeadToUser < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :team_lead, :boolean, default: false

    create_table :user_members do |t|
      t.references :member, foreign_key: { to_table: :users }
      t.references :user

      t.timestamps
    end
  end
end
