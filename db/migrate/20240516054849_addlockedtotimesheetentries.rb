# frozen_string_literal: true

class Addlockedtotimesheetentries < ActiveRecord::Migration[7.1]
  def change
    add_column :timesheet_entries, :locked, :boolean, default: false
  end
end
