# frozen_string_literal: true

class AddTeamMembersToSpaceUsages < ActiveRecord::Migration[7.0]
  def change
    add_column :space_usages, :team_members, :text, array: true, default: []
  end
end
