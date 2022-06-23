# frozen_string_literal: true

class CreateEmploymentDetails < ActiveRecord::Migration[7.0]
  def up
    create_table :employment_details do |t|
      t.references :user, null: false, foreign_key: true
      t.string :employee_id
      t.string :designation
      t.string :official_email_id
      t.string :employment_type
      t.date :joined_at
      t.date :resigned_at
      t.timestamps
    end
  end

  def down
    drop_table :employment_details
  end
end
