# frozen_string_literal: true

class CreateDeviceTimelines < ActiveRecord::Migration[7.0]
  def change
    create_table :device_timelines do |t|
      t.text :index_system_display_message
      t.text :index_system_display_title
      t.references :device, null: false, foreign_key: true
      t.string :action_subject

      t.timestamps
    end
  end
end
