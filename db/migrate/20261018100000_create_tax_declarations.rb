# frozen_string_literal: true

class CreateTaxDeclarations < ActiveRecord::Migration[8.1]
  def change
    create_table :tax_declarations do |t|
      t.references :employment, null: false, foreign_key: true
      t.references :supersedes, foreign_key: { to_table: :tax_declarations }, index: { unique: true }
      t.references :reviewed_by, foreign_key: { to_table: :users }
      t.references :withdrawn_by, foreign_key: { to_table: :users }
      t.integer :tax_year, null: false
      t.string :category, null: false
      t.string :status, null: false, default: "draft"
      t.decimal :claimed_amount, precision: 12, scale: 2, null: false
      t.decimal :approved_amount, precision: 12, scale: 2
      t.text :notes
      t.text :review_reason
      t.datetime :submitted_at
      t.datetime :reviewed_at
      t.datetime :withdrawn_at
      t.timestamps
    end
    add_index :tax_declarations, [:employment_id, :tax_year]
    add_check_constraint :tax_declarations, "claimed_amount > 0", name: "tax_declarations_positive_claim"
    add_check_constraint :tax_declarations,
      "approved_amount IS NULL OR (approved_amount > 0 AND approved_amount <= claimed_amount)",
      name: "tax_declarations_approved_limit"
  end
end
