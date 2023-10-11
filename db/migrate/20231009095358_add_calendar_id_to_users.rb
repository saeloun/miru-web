# frozen_string_literal: true

class AddCalendarIdToUsers < ActiveRecord::Migration[7.0]
  def change
    add_column :users, :calendar_id, :string
  end
end
