# frozen_string_literal: true

class TruncateTeamName < ActiveRecord::Migration[7.0]
  def change
    Invitation.find_each do |invitation|
      invitation.update(first_name: invitation.first_name.slice(0, 20), last_name: invitation.last_name.slice(0, 20))
    end
  end
end
