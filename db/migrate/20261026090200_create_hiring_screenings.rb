# frozen_string_literal: true

class CreateHiringScreenings < ActiveRecord::Migration[8.1]
  def change
    create_table :hiring_screenings do |t|
      t.references :company, null: false, foreign_key: true, index: false
      t.references :hiring_application, null: false, index: false
      t.references :created_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.string :action, null: false
      t.string :from_stage, null: false
      t.string :to_stage, null: false
      t.integer :application_version, null: false
      t.text :details, null: false
      t.timestamps
      t.foreign_key :hiring_applications, column: [:company_id, :hiring_application_id], primary_key: [:company_id, :id]
      t.index [:company_id, :hiring_application_id, :application_version], unique: true, name: "index_hiring_screenings_per_version"
      t.index [:company_id, :hiring_application_id, :id]
    end
  end
end
