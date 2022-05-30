# frozen_string_literal: true

class CreateLeadTimelines < ActiveRecord::Migration[7.0]
  def change
    create_table :lead_timelines do |t|
      t.references :lead, null: false, foreign_key: true
      t.integer :kind
      t.text :comment

      t.timestamps
    end
  end
end
