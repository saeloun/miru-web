# frozen_string_literal: true

class CreateLeadQuotes < ActiveRecord::Migration[7.0]
  def change
    create_table :lead_quotes do |t|
      t.references :lead, null: false, foreign_key: true
      t.string :name
      t.string :description
      t.datetime :discarded_at

      t.index :discarded_at
    end

    create_join_table :lead_quotes, :lead_line_items do |t|
      t.timestamps

      t.index :lead_quote_id
      t.index :lead_line_item_id
    end
  end
end
