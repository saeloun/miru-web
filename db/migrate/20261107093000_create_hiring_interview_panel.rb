# frozen_string_literal: true

class CreateHiringInterviewPanel < ActiveRecord::Migration[8.1]
  def change
    create_table :hiring_panel_members do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :employment, null: false, index: false
      t.text :details, null: false
      t.integer :lock_version, null: false, default: 0
      t.timestamps
      t.index [:company_id, :employment_id], unique: true
      t.index [:company_id, :id], unique: true
      t.foreign_key :employments, column: [:company_id, :employment_id], primary_key: [:company_id, :id], on_delete: :cascade
    end
  end
end
