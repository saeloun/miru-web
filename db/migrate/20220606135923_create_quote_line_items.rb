# frozen_string_literal: true

class CreateQuoteLineItems < ActiveRecord::Migration[7.0]
  def change
    create_table :quote_line_items do |t|
      t.string :name
      t.text :description
      t.text :comment
      t.bigint :estimated_hours
      t.references :lead_line_item
      t.references :lead_quote, null: false, foreign_key: true
      t.integer :number_of_resource
      t.integer :resource_expertise_level

      t.timestamps
    end

    add_column :lead_quotes, :status, :string
    add_column :lead_quotes, :status_comment, :text
  end
end
