# frozen_string_literal: true

class CreateJoinTableUserTeamMembers < ActiveRecord::Migration[7.0]
  def change
    create_table :team_members, id: false do |t|
      t.integer :user_id, null: false
      t.integer :member_user_id, null: false

      t.index [:user_id, :member_user_id]
      t.index [:member_user_id, :user_id]
    end
    User.where.not(team_member_ids: []).each do |i|
      i.team_member_ids = i["team_member_ids"]
      i.save!
    end
    rename_column :users, :team_member_ids, :xteam_member_ids
    add_column :users, :color, :string

    User.all.each do |i|
      i.update_columns(color: SecureRandom.hex(3))
    end
  end
end
