# frozen_string_literal: true

class AddTeamMemberIdsToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :team_member_ids, :text, array: true, default: []
  end
end
