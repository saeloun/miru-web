# frozen_string_literal: true

class CreatePreviousEmploymentDetails < ActiveRecord::Migration[7.0]
  def change
    create_table :previous_employment_details do |t|
      t.references :employment_detail, null: false, foreign_key: true
      t.references :company_user, null: false, foreign_key: true
      t.string :company_name
      t.string :role
      t.timestamps
    end
  end
end
