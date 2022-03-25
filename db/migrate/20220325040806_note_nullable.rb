# frozen_string_literal: true

class NoteNullable < ActiveRecord::Migration[7.0]
  def change
    change_column :timesheet_entries, :note, :text, null: true
  end
end
