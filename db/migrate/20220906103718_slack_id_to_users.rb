# frozen_string_literal: true

class SlackIdToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :slack_member_id, :string
    add_column :users, :slack_member_info, :text
    add_index :users, :slack_member_id, unique: true
  end
end
