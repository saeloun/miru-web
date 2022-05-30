# frozen_string_literal: true

class CreateLeadLineItems < ActiveRecord::Migration[7.0]
  def change
    create_table :lead_line_items do |t|
      t.references :lead, null: false, foreign_key: true
      t.string :name
      t.integer :kind
      t.text :description
      t.integer :numbert_of_resource
      t.integer :resource_expertise_level
      t.float :price

      t.timestamps
    end
  end
end
